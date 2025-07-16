import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

const TechnicalAnalysis = ({ coinId, coinName }) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTechnicalAnalysis = async () => {
    if (!coinId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5001/api/technical/analyze/${coinId}?days=90`
      );
      const data = await response.json();
      setAnalysisData(data);
    } catch (error) {
      console.error('Erro ao buscar análise técnica:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicalAnalysis();
  }, [coinId]);

  const formatIndicatorData = (prices, indicator) => {
    return prices.map((price, index) => ({
      index,
      price,
      indicator: indicator[index]
    })).filter(item => item.indicator !== null && item.indicator !== undefined);
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'bullish': return <TrendingUp className="h-4 w-4" />;
      case 'bearish': return <TrendingDown className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSignalColor = (type) => {
    return type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Nenhum dado de análise técnica disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo da Análise */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Resumo da Análise Técnica - {coinName}</CardTitle>
          <CardDescription className="text-slate-400">
            Indicadores técnicos e sinais de trading para {analysisData.period}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getTrendIcon(analysisData.trend_analysis?.overall_trend)}
                <span className="text-sm text-slate-400">Tendência Geral</span>
              </div>
              <div className={`text-lg font-semibold capitalize ${getTrendColor(analysisData.trend_analysis?.overall_trend)}`}>
                {analysisData.trend_analysis?.overall_trend || 'N/A'}
              </div>
            </div>
            
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <div className="text-sm text-slate-400 mb-2">RSI Atual</div>
              <div className="text-lg font-semibold text-white">
                {analysisData.indicators?.rsi?.slice(-1)[0]?.toFixed(2) || 'N/A'}
              </div>
              <div className="text-xs text-slate-500">
                {analysisData.indicators?.rsi?.slice(-1)[0] > 70 ? 'Sobrecompra' : 
                 analysisData.indicators?.rsi?.slice(-1)[0] < 30 ? 'Sobrevenda' : 'Neutro'}
              </div>
            </div>
            
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <div className="text-sm text-slate-400 mb-2">Sinais Ativos</div>
              <div className="text-lg font-semibold text-white">
                {analysisData.trading_signals?.length || 0}
              </div>
              <div className="text-xs text-slate-500">
                Sinais de trading detectados
              </div>
            </div>
          </div>

          {/* Sinais de Trading */}
          {analysisData.trading_signals && analysisData.trading_signals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Sinais de Trading</h3>
              <div className="space-y-2">
                {analysisData.trading_signals.map((signal, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                    <Badge className={getSignalColor(signal.type)}>
                      {signal.type === 'buy' ? 'COMPRA' : 'VENDA'}
                    </Badge>
                    <div className="flex-1">
                      <div className="text-white font-medium">{signal.indicator}</div>
                      <div className="text-sm text-slate-400">{signal.message}</div>
                    </div>
                    <Badge variant="outline" className="text-slate-300">
                      {signal.strength}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indicadores Técnicos */}
      <Tabs defaultValue="moving-averages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
          <TabsTrigger value="moving-averages" className="text-white">Médias Móveis</TabsTrigger>
          <TabsTrigger value="oscillators" className="text-white">Osciladores</TabsTrigger>
          <TabsTrigger value="bollinger" className="text-white">Bollinger</TabsTrigger>
          <TabsTrigger value="macd" className="text-white">MACD</TabsTrigger>
        </TabsList>

        {/* Médias Móveis */}
        <TabsContent value="moving-averages">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Médias Móveis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={formatIndicatorData(analysisData.prices, analysisData.indicators.sma_20)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="index" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="price" stroke="#3B82F6" name="Preço" strokeWidth={1} />
                  <Line type="monotone" dataKey="indicator" stroke="#F59E0B" name="SMA 20" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Osciladores */}
        <TabsContent value="oscillators">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">RSI (Relative Strength Index)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatIndicatorData(analysisData.prices, analysisData.indicators.rsi)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="index" stroke="#9CA3AF" />
                  <YAxis domain={[0, 100]} stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="indicator" stroke="#8B5CF6" name="RSI" strokeWidth={2} />
                  {/* Linhas de referência */}
                  <Line type="monotone" dataKey={() => 70} stroke="#EF4444" strokeDasharray="5 5" name="Sobrecompra" />
                  <Line type="monotone" dataKey={() => 30} stroke="#10B981" strokeDasharray="5 5" name="Sobrevenda" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bandas de Bollinger */}
        <TabsContent value="bollinger">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Bandas de Bollinger</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={formatIndicatorData(analysisData.prices, analysisData.indicators.bollinger_bands.middle)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="index" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="price" stroke="#3B82F6" name="Preço" strokeWidth={2} />
                  <Line type="monotone" dataKey="indicator" stroke="#F59E0B" name="Média" strokeWidth={1} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MACD */}
        <TabsContent value="macd">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">MACD</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatIndicatorData(analysisData.prices, analysisData.indicators.macd.histogram)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="index" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="indicator" fill="#8B5CF6" name="Histograma MACD" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TechnicalAnalysis;
