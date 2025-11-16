import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, DollarSign, Home, Wrench, Clock, PieChart, Download, Share2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const ROICalculator = () => {
  // Purchase Details
  const [purchasePrice, setPurchasePrice] = useState(150000);
  const [closingCosts, setClosingCosts] = useState(3000);
  const [backTaxes, setBackTaxes] = useState(5000);

  // Renovation & Holding Costs
  const [renovationCosts, setRenovationCosts] = useState(25000);
  const [holdingMonths, setHoldingMonths] = useState(6);
  const [monthlyHoldingCosts, setMonthlyHoldingCosts] = useState(2000);
  const [propertyTaxRate, setPropertyTaxRate] = useState(1.2);
  const [insurance, setInsurance] = useState(1200);

  // Exit Strategy
  const [exitStrategy, setExitStrategy] = useState('flip'); // flip, rental, wholesale
  const [afterRepairValue, setAfterRepairValue] = useState(250000);
  const [sellingCosts, setSellingCosts] = useState(6); // percentage
  const [monthlyRent, setMonthlyRent] = useState(2000);
  const [vacancyRate, setVacancyRate] = useState(5);
  const [maintenanceRate, setMaintenanceRate] = useState(10);
  const [wholesaleFee, setWholesaleFee] = useState(15000);

  // Calculated Values
  const [results, setResults] = useState({});

  useEffect(() => {
    calculateROI();
  }, [purchasePrice, closingCosts, backTaxes, renovationCosts, holdingMonths, monthlyHoldingCosts, propertyTaxRate, insurance, exitStrategy, afterRepairValue, sellingCosts, monthlyRent, vacancyRate, maintenanceRate, wholesaleFee]);

  const calculateROI = () => {
    const totalAcquisition = purchasePrice + closingCosts + backTaxes;
    const annualPropertyTax = purchasePrice * (propertyTaxRate / 100);
    const holdingCostsTotal = (holdingMonths * monthlyHoldingCosts) + (annualPropertyTax / 12 * holdingMonths) + insurance;
    const totalInvestment = totalAcquisition + renovationCosts + holdingCostsTotal;

    let profit = 0;
    let roi = 0;
    let annualReturn = 0;
    let cashFlow = 0;
    let capRate = 0;

    if (exitStrategy === 'flip') {
      const sellingCostsAmount = afterRepairValue * (sellingCosts / 100);
      const netProceeds = afterRepairValue - sellingCostsAmount;
      profit = netProceeds - totalInvestment;
      roi = (profit / totalInvestment) * 100;
      annualReturn = roi / (holdingMonths / 12);
    } else if (exitStrategy === 'rental') {
      const effectiveMonthlyRent = monthlyRent * (1 - vacancyRate / 100);
      const maintenanceCost = monthlyRent * (maintenanceRate / 100);
      const monthlyPropertyTax = annualPropertyTax / 12;
      const monthlyInsurance = insurance / 12;
      cashFlow = effectiveMonthlyRent - maintenanceCost - monthlyPropertyTax - monthlyInsurance;
      const annualCashFlow = cashFlow * 12;
      annualReturn = (annualCashFlow / totalInvestment) * 100;
      const noi = annualCashFlow + (monthlyPropertyTax * 12) + insurance;
      capRate = (noi / purchasePrice) * 100;
    } else if (exitStrategy === 'wholesale') {
      profit = wholesaleFee - closingCosts;
      roi = (profit / (purchasePrice + closingCosts)) * 100;
      annualReturn = roi * (12 / holdingMonths);
    }

    setResults({
      totalAcquisition,
      holdingCostsTotal,
      totalInvestment,
      profit,
      roi,
      annualReturn,
      cashFlow,
      capRate,
      annualPropertyTax
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>ROI Calculator - Tax Deed Pro</title>
        <meta name="description" content="Calculate your return on investment for tax deed properties with our comprehensive calculator." />
      </Helmet>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-slate-900">Investment ROI Calculator</h1>
          </div>
          <p className="text-lg text-slate-600">
            Analyze your tax deed investment with detailed profit projections, holding costs, and multiple exit strategies.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Purchase Details */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Home className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-slate-900">Purchase Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="closingCosts">Closing Costs</Label>
                  <Input
                    id="closingCosts"
                    type="number"
                    value={closingCosts}
                    onChange={(e) => setClosingCosts(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="backTaxes">Back Taxes Owed</Label>
                  <Input
                    id="backTaxes"
                    type="number"
                    value={backTaxes}
                    onChange={(e) => setBackTaxes(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="propertyTaxRate">Property Tax Rate (%)</Label>
                  <Input
                    id="propertyTaxRate"
                    type="number"
                    step="0.1"
                    value={propertyTaxRate}
                    onChange={(e) => setPropertyTaxRate(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            {/* Renovation & Holding Costs */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Wrench className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-slate-900">Renovation & Holding Costs</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="renovationCosts">Renovation Budget</Label>
                  <Input
                    id="renovationCosts"
                    type="number"
                    value={renovationCosts}
                    onChange={(e) => setRenovationCosts(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="holdingMonths">Holding Period (months)</Label>
                  <Input
                    id="holdingMonths"
                    type="number"
                    value={holdingMonths}
                    onChange={(e) => setHoldingMonths(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyHoldingCosts">Monthly Holding Costs</Label>
                  <Input
                    id="monthlyHoldingCosts"
                    type="number"
                    value={monthlyHoldingCosts}
                    onChange={(e) => setMonthlyHoldingCosts(Number(e.target.value))}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">Utilities, HOA, etc.</p>
                </div>
                <div>
                  <Label htmlFor="insurance">Annual Insurance</Label>
                  <Input
                    id="insurance"
                    type="number"
                    value={insurance}
                    onChange={(e) => setInsurance(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            {/* Exit Strategy */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-slate-900">Exit Strategy</h2>
              </div>

              <div className="mb-6">
                <Label>Strategy Type</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {['flip', 'rental', 'wholesale'].map((strategy) => (
                    <button
                      key={strategy}
                      onClick={() => setExitStrategy(strategy)}
                      className={`px-4 py-3 rounded-lg font-semibold capitalize transition-all ${
                        exitStrategy === strategy
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {strategy}
                    </button>
                  ))}
                </div>
              </div>

              {exitStrategy === 'flip' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="afterRepairValue">After Repair Value (ARV)</Label>
                    <Input
                      id="afterRepairValue"
                      type="number"
                      value={afterRepairValue}
                      onChange={(e) => setAfterRepairValue(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sellingCosts">Selling Costs (%)</Label>
                    <Input
                      id="sellingCosts"
                      type="number"
                      step="0.5"
                      value={sellingCosts}
                      onChange={(e) => setSellingCosts(Number(e.target.value))}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">Realtor, closing costs</p>
                  </div>
                </div>
              )}

              {exitStrategy === 'rental' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="monthlyRent">Monthly Rent</Label>
                    <Input
                      id="monthlyRent"
                      type="number"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vacancyRate">Vacancy Rate (%)</Label>
                    <Input
                      id="vacancyRate"
                      type="number"
                      step="1"
                      value={vacancyRate}
                      onChange={(e) => setVacancyRate(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maintenanceRate">Maintenance (%)</Label>
                    <Input
                      id="maintenanceRate"
                      type="number"
                      step="1"
                      value={maintenanceRate}
                      onChange={(e) => setMaintenanceRate(Number(e.target.value))}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">% of monthly rent</p>
                  </div>
                </div>
              )}

              {exitStrategy === 'wholesale' && (
                <div>
                  <Label htmlFor="wholesaleFee">Wholesale Assignment Fee</Label>
                  <Input
                    id="wholesaleFee"
                    type="number"
                    value={wholesaleFee}
                    onChange={(e) => setWholesaleFee(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              )}
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Key Metrics */}
              <Card className="p-6 bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <PieChart className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Results</h2>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <p className="text-purple-100 text-sm mb-1">Total Investment</p>
                    <p className="text-3xl font-bold">{formatCurrency(results.totalInvestment || 0)}</p>
                  </div>

                  {exitStrategy === 'flip' && (
                    <>
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                        <p className="text-purple-100 text-sm mb-1">Net Profit</p>
                        <p className={`text-3xl font-bold ${results.profit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                          {formatCurrency(results.profit || 0)}
                        </p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                        <p className="text-purple-100 text-sm mb-1">ROI</p>
                        <p className={`text-3xl font-bold ${results.roi >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                          {(results.roi || 0).toFixed(2)}%
                        </p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                        <p className="text-purple-100 text-sm mb-1">Annualized Return</p>
                        <p className="text-3xl font-bold">{(results.annualReturn || 0).toFixed(2)}%</p>
                      </div>
                    </>
                  )}

                  {exitStrategy === 'rental' && (
                    <>
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                        <p className="text-purple-100 text-sm mb-1">Monthly Cash Flow</p>
                        <p className={`text-3xl font-bold ${results.cashFlow >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                          {formatCurrency(results.cashFlow || 0)}
                        </p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                        <p className="text-purple-100 text-sm mb-1">Cash on Cash Return</p>
                        <p className="text-3xl font-bold">{(results.annualReturn || 0).toFixed(2)}%</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                        <p className="text-purple-100 text-sm mb-1">Cap Rate</p>
                        <p className="text-3xl font-bold">{(results.capRate || 0).toFixed(2)}%</p>
                      </div>
                    </>
                  )}

                  {exitStrategy === 'wholesale' && (
                    <>
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                        <p className="text-purple-100 text-sm mb-1">Net Profit</p>
                        <p className="text-3xl font-bold text-green-300">{formatCurrency(results.profit || 0)}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                        <p className="text-purple-100 text-sm mb-1">ROI</p>
                        <p className="text-3xl font-bold">{(results.roi || 0).toFixed(2)}%</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 space-y-2">
                  <Button className="w-full bg-white text-purple-600 hover:bg-purple-50">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                  <Button variant="outline" className="w-full border-white text-white hover:bg-white/10">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Analysis
                  </Button>
                </div>
              </Card>

              {/* Cost Breakdown */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Cost Breakdown</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Acquisition:</span>
                    <span className="font-semibold">{formatCurrency(results.totalAcquisition || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Renovations:</span>
                    <span className="font-semibold">{formatCurrency(renovationCosts)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Holding Costs:</span>
                    <span className="font-semibold">{formatCurrency(results.holdingCostsTotal || 0)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg">
                    <span className="font-bold text-slate-900">Total:</span>
                    <span className="font-bold text-purple-600">{formatCurrency(results.totalInvestment || 0)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ROICalculator;
