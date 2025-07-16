import HistoricalData from './HistoricalData';
import TechnicalAnalysis from './TechnicalAnalysis';
import CryptoScreener from './CryptoScreener';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, Search, RefreshCcw } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5001/api/crypto';

const Dashboard = () => {
  const [marketData, setMarketData] = useState([]);
  const [globalData, setGlobalData] = useState(null);
  const [trendingCoins, setTrendingCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [coinHistory, setCoinHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [fearGreedIndex, setFearGreedIndex] = useState(null);

  // Cores para os gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMarketData(),
        fetchGlobalData(),
        fetchTrendingCoins(),
        fetchFearGreedIndex()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/coins/markets?per_page=50`);
      const data = await response.json();
      setMarketData(data);
    } catch (error) {
      console.error('Erro ao buscar dados de mercado:', error);
    }
  };

  const fetchGlobalData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/global`);
      const data = await response.json();
      setGlobalData(data.data);
    } catch (error) {
      console.error('Erro ao buscar dados globais:', error);
    }
  };

  const fetchTrendingCoins = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trending`);
      const data = await response.json();
      setTrendingCoins(data.coins || []);
    } catch (error) {
      console.error('Erro ao buscar moedas em tendência:', error);
    }
  };

  const fetchFearGreedIndex = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/fear-greed`);
      const data = await response.json();
      setFearGreedIndex(data.data?.[0]);
    } catch (error) {
      console.error('Erro ao buscar índice de medo e ganância:', error);
    }
  };

  const fetchCoinHistory = async (coinId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/coins/${coinId}/history?days=30`);
      const data = await response.json();
      
      // Converter dados para formato do gráfico
      const chartData = data.prices?.map((price, index) => ({
        date: new Date(price[0]).toLocaleDateString(),
        price: price[1],
        volume: data.total_volumes?.[index]?.[1] || 0
      })) || [];
      
      setCoinHistory(chartData);
    } catch (error) {
      console.error('Erro ao buscar histórico da moeda:', error);
    }
  };

  const handleCoinSelect = (coin) => {
    setSelectedCoin(coin);
    fetchCoinHistory(coin.id);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value);
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const filteredMarketData = marketData.filter(coin =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Dados para o gráfico de pizza (top 5 moedas por market cap)
  const pieData = marketData.slice(0, 5).map(coin => ({
    name: coin.symbol.toUpperCase(),
    value: coin.market_cap,
    percentage: ((coin.market_cap / marketData.slice(0, 5).reduce((sum, c) => sum + c.market_cap, 0)) * 100).toFixed(1)
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Sistema de Análise de Criptomoedas
            </h1>
            <p className="text-slate-300">
              Análise completa do mercado de criptomoedas em tempo real
            </p>
          </div>
          <Button onClick={fetchInitialData} className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            Atualizar Dados
          </Button>
        </div>

        {/* Cards de Estatísticas Globais */}
        {globalData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">
                  Market Cap Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  ${(globalData.total_market_cap?.usd / 1e12).toFixed(2)}T
                </div>
                <p className="text-xs text-slate-400">
                  {formatPercentage(globalData.market_cap_change_percentage_24h_usd)} nas últimas 24h
                </p>
              </CardContent>
            </Card>
        
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">
                  Volume 24h
                </CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  ${(globalData.total_volume?.usd / 1e9).toFixed(2)}B
                </div>
                <p className="text-xs text-slate-400">
                  Volume de negociação
                </p>
              </CardContent>
            </Card>
        
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">
                  Dominância BTC
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {globalData.market_cap_percentage?.btc?.toFixed(1)}%
                </div>
                <p className="text-xs text-slate-400">
                  Participação do Bitcoin
                </p>
              </CardContent>
            </Card>
        
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">
                  Dominância ETH
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {globalData.market_cap_percentage?.eth?.toFixed(1)}%
                </div>
                <p className="text-xs text-slate-400">
                  Participação do Ethereum
                </p>
              </CardContent>
            </Card>
        
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">
                  Criptomoedas Ativas
                </CardTitle>
                <Activity className="h-4 w-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {globalData.active_cryptocurrencies?.toLocaleString()}
                </div>
                <p className="text-xs text-slate-400">
                  Moedas no mercado
                </p>
              </CardContent>
            </Card>
        
            {fearGreedIndex && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    Índice Medo & Ganância
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {fearGreedIndex.value}
                  </div>
                  <p className="text-xs text-slate-400">
                    {fearGreedIndex.value_classification}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tabs principais */}
        <Tabs defaultValue="market" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
            <TabsTrigger value="market" className="text-white">Mercado</TabsTrigger>
            <TabsTrigger value="trending" className="text-white">Tendências</TabsTrigger>
            <TabsTrigger value="analysis" className="text-white">Análise</TabsTrigger>
            <TabsTrigger value="historical" className="text-white">Histórico</TabsTrigger>
            <TabsTrigger value="screener" className="text-white">Screener</TabsTrigger>
            <TabsTrigger value="portfolio" className="text-white">Portfólio</TabsTrigger>
          </TabsList>

          {/* Tab Mercado */}
          <TabsContent value="market" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Lista de Moedas */}
              <Card className="flex-1 bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">Top Criptomoedas</CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar moeda..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredMarketData.slice(0, 20).map((coin) => (
                      <div
                        key={coin.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 cursor-pointer transition-colors"
                        onClick={() => handleCoinSelect(coin)}
                      >
                        <div className="flex items-center gap-3">
                          <img src={coin.image} alt={coin.name} className="w-8 h-8" />
                          <div>
                            <div className="font-medium text-white">{coin.name}</div>
                            <div className="text-sm text-slate-400">{coin.symbol.toUpperCase()}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-white">
                            {formatCurrency(coin.current_price)}
                          </div>
                          <div className={`text-sm flex items-center gap-1 ${
                            coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {coin.price_change_percentage_24h >= 0 ? 
                              <TrendingUp className="h-3 w-3" /> : 
                              <TrendingDown className="h-3 w-3" />
                            }
                            {formatPercentage(coin.price_change_percentage_24h)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Pizza - Dominância */}
              <Card className="w-full md:w-96 bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Dominância de Mercado</CardTitle>
                  <CardDescription className="text-slate-400">
                    Top 5 criptomoedas por market cap
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Tendências */}
          <TabsContent value="trending" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Moedas em Tendência</CardTitle>
                <CardDescription className="text-slate-400">
                  As criptomoedas mais pesquisadas no momento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trendingCoins.slice(0, 6).map((trendingCoin, index) => (
                    <Card key={trendingCoin.item.id} className="bg-slate-700/50 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                            #{index + 1}
                          </Badge>
                          <img 
                            src={trendingCoin.item.large} 
                            alt={trendingCoin.item.name} 
                            className="w-8 h-8" 
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium text-white">{trendingCoin.item.name}</div>
                          <div className="text-sm text-slate-400">
                            {trendingCoin.item.symbol}
                          </div>
                          <div className="text-sm text-slate-300">
                            Rank: #{trendingCoin.item.market_cap_rank || 'N/A'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Análise */}
          <TabsContent value="analysis" className="space-y-6">
            {selectedCoin ? (
              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <img src={selectedCoin.image} alt={selectedCoin.name} className="w-10 h-10" />
                      <div>
                        <CardTitle className="text-white">{selectedCoin.name}</CardTitle>
                        <CardDescription className="text-slate-400">
                          {selectedCoin.symbol.toUpperCase()} - Análise de 30 dias
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">
                          {formatCurrency(selectedCoin.current_price)}
                        </div>
                        <div className="text-sm text-slate-400">Preço Atual</div>
                      </div>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <div className={`text-2xl font-bold ${
                          selectedCoin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercentage(selectedCoin.price_change_percentage_24h)}
                        </div>
                        <div className="text-sm text-slate-400">24h</div>
                      </div>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">
                          ${(selectedCoin.market_cap / 1e9).toFixed(2)}B
                        </div>
                        <div className="text-sm text-slate-400">Market Cap</div>
                      </div>
                    </div>
                    
                    {coinHistory.length > 0 && (
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={coinHistory}>
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
                          <Area 
                            type="monotone" 
                            dataKey="price" 
                            stroke="#3B82F6" 
                            fill="url(#colorPrice)" 
                          />
                          <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">
                      Selecione uma criptomoeda na aba "Mercado" para ver a análise detalhada
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Histórico */}
          <TabsContent value="historical" className="space-y-6">
            {selectedCoin ? (
              <HistoricalData 
                coinId={selectedCoin.id} 
                coinName={selectedCoin.name} 
              />
            ) : (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">
                      Selecione uma criptomoeda na aba "Mercado" para ver os dados históricos
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Análise */}
          <TabsContent value="analysis" className="space-y-6">
            {selectedCoin ? (
              <TechnicalAnalysis 
                coinId={selectedCoin.id} 
                coinName={selectedCoin.name} 
              />
            ) : (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">
                      Selecione uma criptomoeda na aba "Mercado" para ver a análise técnica completa
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Screener */}
          <TabsContent value="screener" className="space-y-6">
            <CryptoScreener />
          </TabsContent>

          {/* Tab Portfólio */}
          <TabsContent value="portfolio" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Análise de Portfólio</CardTitle>
                <CardDescription className="text-slate-400">
                  Funcionalidade em desenvolvimento - Em breve você poderá analisar seu portfólio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <DollarSign className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">
                      Análise de portfólio será implementada na próxima versão
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;