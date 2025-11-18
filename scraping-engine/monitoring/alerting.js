import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { logger } from '../utils/logger.js';

export class AlertingSystem {
  constructor(config = {}) {
    this.config = {
      email: {
        enabled: config.email?.enabled ?? false,
        from: config.email?.from || process.env.ALERT_EMAIL_FROM,
        to: config.email?.to || process.env.ALERT_EMAIL_TO,
        ...config.email
      },
      sms: {
        enabled: config.sms?.enabled ?? false,
        from: config.sms?.from || process.env.TWILIO_PHONE_NUMBER,
        to: config.sms?.to || process.env.ALERT_SMS_TO,
        ...config.sms
      },
      webhook: {
        enabled: config.webhook?.enabled ?? false,
        url: config.webhook?.url || process.env.ALERT_WEBHOOK_URL,
        ...config.webhook
      },
      thresholds: {
        errorRate: config.thresholds?.errorRate || 0.1, // 10%
        queueSize: config.thresholds?.queueSize || 1000,
        failedJobs: config.thresholds?.failedJobs || 50,
        proxyFailureRate: config.thresholds?.proxyFailureRate || 0.5,
        ...config.thresholds
      },
      ...config
    };

    this.alertHistory = new Map();
    this.cooldownPeriod = 300000; // 5 minutes between same alerts

    this.initializeTransports();
  }

  initializeTransports() {
    // Email transport
    if (this.config.email.enabled) {
      this.emailTransport = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
      logger.info('Email alerting enabled');
    }

    // SMS transport
    if (this.config.sms.enabled && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      logger.info('SMS alerting enabled');
    }
  }

  async sendAlert(alert) {
    const { type, severity, title, message, data } = alert;

    // Check cooldown
    const alertKey = `${type}_${severity}`;
    const lastAlert = this.alertHistory.get(alertKey);

    if (lastAlert && Date.now() - lastAlert < this.cooldownPeriod) {
      logger.debug(`Alert ${alertKey} in cooldown period, skipping`);
      return;
    }

    this.alertHistory.set(alertKey, Date.now());

    logger.warn(`Sending alert: [${severity}] ${title}`);

    const promises = [];

    // Email
    if (this.config.email.enabled && this.shouldSendEmail(severity)) {
      promises.push(this.sendEmail(alert));
    }

    // SMS
    if (this.config.sms.enabled && this.shouldSendSMS(severity)) {
      promises.push(this.sendSMS(alert));
    }

    // Webhook
    if (this.config.webhook.enabled) {
      promises.push(this.sendWebhook(alert));
    }

    try {
      await Promise.allSettled(promises);
      logger.info(`Alert sent successfully: ${title}`);
    } catch (error) {
      logger.error('Failed to send alert:', error);
    }
  }

  async sendEmail(alert) {
    const { severity, title, message, data } = alert;

    const html = `
      <h2 style="color: ${this.getSeverityColor(severity)}">
        ${this.getSeverityEmoji(severity)} ${title}
      </h2>
      <p>${message}</p>
      ${data ? `<pre>${JSON.stringify(data, null, 2)}</pre>` : ''}
      <hr>
      <small>Sent at ${new Date().toISOString()}</small>
    `;

    try {
      await this.emailTransport.sendMail({
        from: this.config.email.from,
        to: this.config.email.to,
        subject: `[${severity.toUpperCase()}] ${title}`,
        html
      });
      logger.debug('Email alert sent');
    } catch (error) {
      logger.error('Failed to send email alert:', error);
    }
  }

  async sendSMS(alert) {
    const { severity, title, message } = alert;
    const text = `[${severity.toUpperCase()}] ${title}\n${message}`;

    try {
      await this.twilioClient.messages.create({
        body: text.substring(0, 1600), // SMS limit
        from: this.config.sms.from,
        to: this.config.sms.to
      });
      logger.debug('SMS alert sent');
    } catch (error) {
      logger.error('Failed to send SMS alert:', error);
    }
  }

  async sendWebhook(alert) {
    try {
      const response = await fetch(this.config.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...alert,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      logger.debug('Webhook alert sent');
    } catch (error) {
      logger.error('Failed to send webhook alert:', error);
    }
  }

  shouldSendEmail(severity) {
    return ['high', 'critical'].includes(severity);
  }

  shouldSendSMS(severity) {
    return severity === 'critical';
  }

  getSeverityColor(severity) {
    const colors = {
      low: '#3498db',
      medium: '#f39c12',
      high: '#e67e22',
      critical: '#e74c3c'
    };
    return colors[severity] || '#95a5a6';
  }

  getSeverityEmoji(severity) {
    const emojis = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🔥',
      critical: '🚨'
    };
    return emojis[severity] || '📋';
  }

  // Predefined alert types
  async alertHighErrorRate(errorRate, timeWindow) {
    await this.sendAlert({
      type: 'high_error_rate',
      severity: errorRate > 0.25 ? 'critical' : 'high',
      title: 'High Error Rate Detected',
      message: `Error rate is ${(errorRate * 100).toFixed(2)}% over the last ${timeWindow} minutes`,
      data: { errorRate, timeWindow, threshold: this.config.thresholds.errorRate }
    });
  }

  async alertQueueBacklog(queueName, size) {
    await this.sendAlert({
      type: 'queue_backlog',
      severity: size > this.config.thresholds.queueSize * 2 ? 'critical' : 'high',
      title: 'Queue Backlog Alert',
      message: `Queue "${queueName}" has ${size} pending jobs`,
      data: { queueName, size, threshold: this.config.thresholds.queueSize }
    });
  }

  async alertProxyFailure(proxyId, failureRate) {
    await this.sendAlert({
      type: 'proxy_failure',
      severity: 'medium',
      title: 'Proxy Failure',
      message: `Proxy ${proxyId} has ${(failureRate * 100).toFixed(2)}% failure rate`,
      data: { proxyId, failureRate }
    });
  }

  async alertSystemError(error, context) {
    await this.sendAlert({
      type: 'system_error',
      severity: 'critical',
      title: 'System Error',
      message: `Critical error: ${error.message}`,
      data: {
        error: error.stack,
        context
      }
    });
  }

  async alertJobFailed(jobId, jobType, error) {
    await this.sendAlert({
      type: 'job_failed',
      severity: 'medium',
      title: 'Job Failed',
      message: `Job ${jobId} (${jobType}) failed: ${error}`,
      data: { jobId, jobType, error }
    });
  }

  async alertNoHealthyProxies() {
    await this.sendAlert({
      type: 'no_healthy_proxies',
      severity: 'critical',
      title: 'No Healthy Proxies Available',
      message: 'All proxies are marked as unhealthy. Scraping operations may be affected.',
      data: {}
    });
  }

  async alertStorageFull(usage) {
    await this.sendAlert({
      type: 'storage_full',
      severity: 'high',
      title: 'Storage Almost Full',
      message: `Storage usage is at ${usage}%`,
      data: { usage }
    });
  }

  async alertAIQuotaExceeded(provider, quotaType) {
    await this.sendAlert({
      type: 'ai_quota_exceeded',
      severity: 'high',
      title: 'AI API Quota Exceeded',
      message: `${provider} ${quotaType} quota has been exceeded`,
      data: { provider, quotaType }
    });
  }

  async healthCheck() {
    // Perform health checks and send alerts if needed
    // This would be called periodically
    logger.debug('Running health checks...');
  }
}

export const alerting = new AlertingSystem();
