import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const HistoricalData = ({ coinId, coinName }) => {
  const [historicalData, setHistoricalData] = useState(null);
  const [period, setPeriod] = useState('30');
  const [currency, setCurrency] = useState('usd');
  const [loading, setLoading] = useState(false);

  const fetchHistoricalData = async () => {
    if (!coinId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5001/api/crypto/coins/${coinId}/history?days=${period}&vs_currency=${currency}`
      );
      const data = await response.json();
      
      // Processar dados para o gráfico
      const chartData = data.prices?.map((price, index) => ({
        date: new Date(price[0]).toLocaleDateString(),
        timestamp: price[0],
        price: price[1],
        volume: data.total_volumes?.[index]?.[1] || 0,
        marketCap: data.market_caps?.[index]?.[1] || 0
      })) || [];
      
      setHistoricalData(chartData);
    } catch (error) {
      console.error('Erro ao buscar dados históricos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData();
  }, [coinId, period, currency]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value);
  };

  const formatVolume = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white">
                Dados Históricos - {coinName}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Preços, volumes e capitalização de mercado ao longo do tempo
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Dia</SelectItem>
                  <SelectItem value="7">7 Dias</SelectItem>
                  <SelectItem value="30">30 Dias</SelectItem>
                  <SelectItem value="90">90 Dias</SelectItem>
                  <SelectItem value="365">1 Ano</SelectItem>
                  <SelectItem value="max">Máximo</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-24 bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="brl">BRL</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : historicalData && historicalData.length > 0 ? (
            <div className="space-y-6">
              {/* Gráfico de Preços */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Evolução do Preço</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [formatCurrency(value), 'Preço']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico de Volume */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Volume de Negociação</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [formatVolume(value), 'Volume']}
                    />
                    <Bar dataKey="volume" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Estatísticas do Período */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <div className="text-sm text-slate-400">Preço Inicial</div>
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(historicalData[0]?.price || 0)}
                  </div>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <div className="text-sm text-slate-400">Preço Final</div>
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(historicalData[historicalData.length - 1]?.price || 0)}
                  </div>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <div className="text-sm text-slate-400">Maior Preço</div>
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(Math.max(...historicalData.map(d => d.price)))}
                  </div>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <div className="text-sm text-slate-400">Menor Preço</div>
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(Math.min(...historicalData.map(d => d.price)))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-slate-400">Nenhum dado histórico disponível</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoricalData;
