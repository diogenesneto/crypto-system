import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Filter } from 'lucide-react';

const CryptoScreener = () => {
  const [screenedCoins, setScreenedCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    min_volume: '1000000',
    min_rsi: '30',
    max_rsi: '70',
    trend: 'all'
  });

  const fetchScreenedCoins = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(
        `http://localhost:5001/api/technical/screener?${queryParams}`
      );
      const data = await response.json();
      setScreenedCoins(data.coins || []);
    } catch (error) {
      console.error('Erro ao buscar moedas filtradas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenedCoins();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value);
  };

  const formatVolume = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${(value / 1e3).toFixed(2)}K`;
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'bullish': return 'bg-green-500/20 text-green-400';
      case 'bearish': return 'bg-red-500/20 text-red-400';
      default: return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  const getRSIColor = (rsi) => {
    if (rsi > 70) return 'text-red-400';
    if (rsi < 30) return 'text-green-400';
    return 'text-white';
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Screener de Criptomoedas
          </CardTitle>
          <CardDescription className="text-slate-400">
            Filtre criptomoedas baseado em critérios técnicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Volume Mínimo (USD)</label>
              <Input
                type="number"
                value={filters.min_volume}
                onChange={(e) => handleFilterChange('min_volume', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="1000000"
              />
            </div>
            
            <div>
              <label className="text-sm text-slate-400 mb-2 block">RSI Mínimo</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={filters.min_rsi}
                onChange={(e) => handleFilterChange('min_rsi', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="30"
              />
            </div>
            
            <div>
              <label className="text-sm text-slate-400 mb-2 block">RSI Máximo</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={filters.max_rsi}
                onChange={(e) => handleFilterChange('max_rsi', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="70"
              />
            </div>
            
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Tendência</label>
              <Select value={filters.trend} onValueChange={(value) => handleFilterChange('trend', value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="bullish">Alta</SelectItem>
                  <SelectItem value="bearish">Baixa</SelectItem>
                  <SelectItem value="sideways">Lateral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={fetchScreenedCoins} className="w-full mb-6">
            Aplicar Filtros
          </Button>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-slate-400 mb-4">
                {screenedCoins.length} moedas encontradas
              </div>
              
              {screenedCoins.map((coin) => (
                <div
                  key={coin.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium text-white">{coin.name}</div>
                      <div className="text-sm text-slate-400">{coin.symbol.toUpperCase()}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium text-white">
                        {formatCurrency(coin.current_price)}
                      </div>
                      <div className={`text-sm flex items-center gap-1 ${
                        coin.price_change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {coin.price_change_24h >= 0 ? 
                          <TrendingUp className="h-3 w-3" /> : 
                          <TrendingDown className="h-3 w-3" />
                        }
                        {coin.price_change_24h.toFixed(2)}%
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-slate-400">Volume</div>
                      <div className="text-white">{formatVolume(coin.volume)}</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-slate-400">RSI</div>
                      <div className={`font-medium ${getRSIColor(coin.rsi)}`}>
                        {coin.rsi.toFixed(1)}
                      </div>
                    </div>
                    
                    <Badge className={getTrendColor(coin.trend)}>
                      {coin.trend}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CryptoScreener;
