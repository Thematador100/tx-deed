import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { motion } from 'framer-motion';
import {
  stateRules,
  getTopROIStates,
  getSaleTypeDistribution,
  getCompetitionLevelStats,
  getTaxLienStates,
  getTaxDeedStates,
  getHybridStates,
  getBestStatesForBeginners
} from '@/lib/stateRules';

const COLORS = {
  primary: '#7C3AED',
  secondary: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  chart1: '#7C3AED',
  chart2: '#06B6D4',
  chart3: '#10B981',
  chart4: '#F59E0B',
  chart5: '#EF4444',
  chart6: '#8B5CF6',
  chart7: '#14B8A6',
  chart8: '#F97316'
};

const COMPETITION_COLORS = {
  'Low': '#10B981',
  'Low-Medium': '#34D399',
  'Medium': '#FBBF24',
  'Medium-High': '#F59E0B',
  'High': '#F97316',
  'Very High': '#EF4444',
  'Extreme': '#DC2626'
};

const PROFIT_COLORS = {
  'Low-Medium': '#F59E0B',
  'Medium': '#FBBF24',
  'Medium-High': '#34D399',
  'High': '#10B981',
  'Very High': '#059669'
};

/**
 * Interest Rate Comparison Chart
 */
export const InterestRateChart = ({ limit = 20 }) => {
  const chartData = useMemo(() => {
    return Object.values(stateRules)
      .filter(state => state.interestRatePercent > 0)
      .sort((a, b) => b.interestRatePercent - a.interestRatePercent)
      .slice(0, limit)
      .map(state => ({
        state: state.abbreviation,
        rate: state.interestRatePercent,
        fullName: state.state
      }));
  }, [limit]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-6 shadow-lg"
    >
      <h3 className="text-xl font-bold mb-4">Top Redemption Interest Rates by State</h3>
      <p className="text-gray-600 mb-6">Higher rates = better returns when properties redeem</p>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" unit="%" />
          <YAxis dataKey="state" type="category" width={40} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 rounded shadow-lg border">
                    <p className="font-bold">{payload[0].payload.fullName}</p>
                    <p className="text-purple-600 font-semibold">{payload[0].value}% Annual Interest</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="rate" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

/**
 * Redemption Period Comparison
 */
export const RedemptionPeriodChart = ({ limit = 15 }) => {
  const chartData = useMemo(() => {
    return Object.values(stateRules)
      .filter(state => state.redemptionPeriodDays > 0)
      .sort((a, b) => a.redemptionPeriodDays - b.redemptionPeriodDays)
      .slice(0, limit)
      .map(state => ({
        state: state.abbreviation,
        days: state.redemptionPeriodDays,
        months: Math.round(state.redemptionPeriodDays / 30),
        fullName: state.state,
        period: state.redemptionPeriod
      }));
  }, [limit]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-lg p-6 shadow-lg"
    >
      <h3 className="text-xl font-bold mb-4">Shortest Redemption Periods</h3>
      <p className="text-gray-600 mb-6">Faster access to property ownership</p>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="state" />
          <YAxis unit=" days" />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 rounded shadow-lg border">
                    <p className="font-bold">{payload[0].payload.fullName}</p>
                    <p className="text-cyan-600 font-semibold">{payload[0].payload.period}</p>
                    <p className="text-sm text-gray-600">{payload[0].value} days</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="days" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

/**
 * Sale Type Distribution Pie Chart
 */
export const SaleTypeDistribution = () => {
  const distribution = useMemo(() => getSaleTypeDistribution(), []);

  const pieData = [
    { name: 'Tax Lien States', value: distribution.taxLien, color: COLORS.chart1 },
    { name: 'Tax Deed States', value: distribution.taxDeed, color: COLORS.chart2 },
    { name: 'Hybrid States', value: distribution.hybrid, color: COLORS.chart3 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-lg p-6 shadow-lg"
    >
      <h3 className="text-xl font-bold mb-4">Sale Type Distribution</h3>
      <p className="text-gray-600 mb-6">Understanding the investment landscape</p>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{distribution.taxLien}</div>
          <div className="text-sm text-gray-600">Tax Lien</div>
        </div>
        <div className="p-3 bg-cyan-50 rounded-lg">
          <div className="text-2xl font-bold text-cyan-600">{distribution.taxDeed}</div>
          <div className="text-sm text-gray-600">Tax Deed</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{distribution.hybrid}</div>
          <div className="text-sm text-gray-600">Hybrid</div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Competition Level Heatmap
 */
export const CompetitionHeatmap = () => {
  const stats = useMemo(() => {
    const rawStats = getCompetitionLevelStats();
    return Object.entries(rawStats).map(([level, count]) => ({
      level,
      count,
      color: COMPETITION_COLORS[level]
    }));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-lg p-6 shadow-lg"
    >
      <h3 className="text-xl font-bold mb-4">Market Competition Analysis</h3>
      <p className="text-gray-600 mb-6">Competition levels across all states</p>
      <div className="space-y-3">
        {stats.map(({ level, count, color }) => (
          <div key={level} className="flex items-center gap-4">
            <div className="w-32 font-medium text-sm">{level}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(count / 51) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="h-full rounded-full flex items-center justify-end pr-3"
                style={{ backgroundColor: color }}
              >
                <span className="text-white font-bold text-sm">{count}</span>
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/**
 * ROI Potential Radar Chart
 */
export const ROIRadarChart = () => {
  const topStates = useMemo(() => {
    return getTopROIStates(8).map(state => {
      const maxROI = parseFloat(state.avgROI.split('-')[1] || state.avgROI.split('-')[0]) || 0;
      return {
        state: state.abbreviation,
        roi: maxROI,
        interest: state.interestRatePercent,
        redemption: 100 - (state.redemptionPeriodDays / 1460 * 100), // Inverse - shorter is better
        competition: ['Low', 'Low-Medium'].includes(state.competitionLevel) ? 80 :
                     ['Medium', 'Medium-High'].includes(state.competitionLevel) ? 50 : 20
      };
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-lg p-6 shadow-lg"
    >
      <h3 className="text-xl font-bold mb-4">Top States: Multi-Factor Analysis</h3>
      <p className="text-gray-600 mb-6">ROI, Interest Rates, Redemption Speed & Competition</p>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={topStates}>
          <PolarGrid />
          <PolarAngleAxis dataKey="state" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar name="ROI Potential" dataKey="roi" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
          <Radar name="Interest Rate" dataKey="interest" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.3} />
          <Tooltip />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

/**
 * ROI vs Competition Scatter Plot
 */
export const ROICompetitionScatter = () => {
  const scatterData = useMemo(() => {
    return Object.values(stateRules).map(state => {
      const maxROI = parseFloat(state.avgROI.split('-')[1] || state.avgROI.split('-')[0]) || 0;
      const competitionScore = {
        'Low': 1,
        'Low-Medium': 2,
        'Medium': 3,
        'Medium-High': 4,
        'High': 5,
        'Very High': 6,
        'Extreme': 7
      }[state.competitionLevel] || 3;

      return {
        state: state.abbreviation,
        roi: maxROI,
        competition: competitionScore,
        fullName: state.state,
        profitPotential: state.profitPotential
      };
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white rounded-lg p-6 shadow-lg"
    >
      <h3 className="text-xl font-bold mb-4">ROI vs Competition Matrix</h3>
      <p className="text-gray-600 mb-6">Find the sweet spot: High ROI, Low Competition</p>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="competition"
            name="Competition"
            domain={[0, 8]}
            ticks={[1, 2, 3, 4, 5, 6, 7]}
            tickFormatter={(value) => ['', 'Low', 'Low-Med', 'Med', 'Med-Hi', 'High', 'V.High', 'Extreme'][value] || ''}
          />
          <YAxis type="number" dataKey="roi" name="ROI" unit="%" />
          <ZAxis range={[60, 400]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-4 rounded shadow-lg border">
                    <p className="font-bold text-lg">{data.fullName}</p>
                    <p className="text-purple-600">ROI: {data.roi}%</p>
                    <p className="text-gray-600">Profit: {data.profitPotential}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter
            name="States"
            data={scatterData}
            fill={COLORS.primary}
          >
            {scatterData.map((entry, index) => {
              const color = entry.roi > 20 && entry.competition < 4 ? COLORS.success :
                           entry.roi > 15 ? COLORS.warning : COLORS.danger;
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-4 flex gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.success }}></div>
          <span>Best Opportunity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.warning }}></div>
          <span>Good ROI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.danger }}></div>
          <span>Challenging</span>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Beginner-Friendly States Showcase
 */
export const BeginnerFriendlyStates = () => {
  const beginnerStates = useMemo(() => getBestStatesForBeginners(), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-gradient-to-br from-purple-50 to-cyan-50 rounded-lg p-6 shadow-lg"
    >
      <h3 className="text-xl font-bold mb-4">Beginner-Friendly States</h3>
      <p className="text-gray-600 mb-6">
        Great places to start: Lower competition, reasonable redemption, good returns
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {beginnerStates.map((state, index) => (
          <motion.div
            key={state.abbreviation}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 + (index * 0.05) }}
            className="bg-white rounded-lg p-4 shadow hover:shadow-lg transition-shadow"
          >
            <div className="text-2xl font-bold text-purple-600 mb-1">{state.abbreviation}</div>
            <div className="text-sm font-medium text-gray-700 mb-2">{state.state}</div>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Interest:</span>
                <span className="font-semibold text-green-600">{state.interestRatePercent}%</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-semibold">{state.saleType.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Competition:</span>
                <span className="font-semibold" style={{ color: COMPETITION_COLORS[state.competitionLevel] }}>
                  {state.competitionLevel}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

/**
 * State Comparison Table Component
 */
export const StateComparisonTable = ({ states = [] }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'interestRatePercent', direction: 'desc' });

  const sortedStates = useMemo(() => {
    const statesToSort = states.length > 0
      ? states
      : Object.values(stateRules);

    return [...statesToSort].sort((a, b) => {
      if (sortConfig.key === 'avgROI') {
        const aROI = parseFloat(a.avgROI.split('-')[1] || a.avgROI.split('-')[0]) || 0;
        const bROI = parseFloat(b.avgROI.split('-')[1] || b.avgROI.split('-')[0]) || 0;
        return sortConfig.direction === 'asc' ? aROI - bROI : bROI - aROI;
      }

      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return sortConfig.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [states, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-lg shadow-lg overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('state')}
              >
                State {sortConfig.key === 'state' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('saleType')}
              >
                Type {sortConfig.key === 'saleType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('interestRatePercent')}
              >
                Interest {sortConfig.key === 'interestRatePercent' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('redemptionPeriodDays')}
              >
                Redemption {sortConfig.key === 'redemptionPeriodDays' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('competitionLevel')}
              >
                Competition {sortConfig.key === 'competitionLevel' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-purple-700"
                onClick={() => handleSort('avgROI')}
              >
                ROI {sortConfig.key === 'avgROI' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedStates.map((state, index) => (
              <motion.tr
                key={state.abbreviation}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="hover:bg-purple-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-bold text-purple-600">{state.abbreviation}</div>
                    <div className="ml-2 text-sm text-gray-900">{state.state}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                    {state.saleType.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                  {state.interestRatePercent}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {state.redemptionPeriod}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                    style={{
                      backgroundColor: `${COMPETITION_COLORS[state.competitionLevel]}20`,
                      color: COMPETITION_COLORS[state.competitionLevel]
                    }}
                  >
                    {state.competitionLevel}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">
                  {state.avgROI}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default {
  InterestRateChart,
  RedemptionPeriodChart,
  SaleTypeDistribution,
  CompetitionHeatmap,
  ROIRadarChart,
  ROICompetitionScatter,
  BeginnerFriendlyStates,
  StateComparisonTable
};
