from flask import Blueprint, jsonify, request
import requests
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

technical_bp = Blueprint('technical', __name__)

# Base URL da API CoinGecko
COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"

def calculate_sma(prices, window):
    """Calcula a Média Móvel Simples (SMA)"""
    return pd.Series(prices).rolling(window=window).mean().tolist()

def calculate_ema(prices, window):
    """Calcula a Média Móvel Exponencial (EMA)"""
    return pd.Series(prices).ewm(span=window).mean().tolist()

def calculate_rsi(prices, window=14):
    """Calcula o Índice de Força Relativa (RSI)"""
    prices_series = pd.Series(prices)
    delta = prices_series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi.tolist()

def calculate_bollinger_bands(prices, window=20, num_std=2):
    """Calcula as Bandas de Bollinger"""
    prices_series = pd.Series(prices)
    sma = prices_series.rolling(window=window).mean()
    std = prices_series.rolling(window=window).std()
    
    upper_band = sma + (std * num_std)
    lower_band = sma - (std * num_std)
    
    return {
        'upper': upper_band.tolist(),
        'middle': sma.tolist(),
        'lower': lower_band.tolist()
    }

def calculate_macd(prices, fast=12, slow=26, signal=9):
    """Calcula o MACD (Moving Average Convergence Divergence)"""
    prices_series = pd.Series(prices)
    ema_fast = prices_series.ewm(span=fast).mean()
    ema_slow = prices_series.ewm(span=slow).mean()
    
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal).mean()
    histogram = macd_line - signal_line
    
    return {
        'macd': macd_line.tolist(),
        'signal': signal_line.tolist(),
        'histogram': histogram.tolist()
    }

def calculate_stochastic(high_prices, low_prices, close_prices, k_window=14, d_window=3):
    """Calcula o Oscilador Estocástico"""
    high_series = pd.Series(high_prices)
    low_series = pd.Series(low_prices)
    close_series = pd.Series(close_prices)
    
    lowest_low = low_series.rolling(window=k_window).min()
    highest_high = high_series.rolling(window=k_window).max()
    
    k_percent = 100 * ((close_series - lowest_low) / (highest_high - lowest_low))
    d_percent = k_percent.rolling(window=d_window).mean()
    
    return {
        'k': k_percent.tolist(),
        'd': d_percent.tolist()
    }

def detect_support_resistance(prices, window=20):
    """Detecta níveis de suporte e resistência"""
    prices_series = pd.Series(prices)
    
    # Encontrar máximos e mínimos locais
    highs = prices_series.rolling(window=window, center=True).max()
    lows = prices_series.rolling(window=window, center=True).min()
    
    resistance_levels = []
    support_levels = []
    
    for i in range(len(prices)):
        if prices[i] == highs.iloc[i] and not pd.isna(highs.iloc[i]):
            resistance_levels.append({'index': i, 'price': prices[i]})
        if prices[i] == lows.iloc[i] and not pd.isna(lows.iloc[i]):
            support_levels.append({'index': i, 'price': prices[i]})
    
    return {
        'resistance': resistance_levels,
        'support': support_levels
    }

def analyze_trend(prices):
    """Analisa a tendência dos preços"""
    if len(prices) < 2:
        return 'insufficient_data'
    
    # Calcular a inclinação da linha de tendência
    x = np.arange(len(prices))
    y = np.array(prices)
    
    # Regressão linear simples
    slope = np.polyfit(x, y, 1)[0]
    
    # Determinar tendência
    if slope > 0.01:
        return 'bullish'
    elif slope < -0.01:
        return 'bearish'
    else:
        return 'sideways'

@technical_bp.route('/analyze/<coin_id>', methods=['GET'])
def technical_analysis(coin_id):
    """Realiza análise técnica completa de uma criptomoeda"""
    try:
        # Parâmetros
        days = request.args.get('days', '90')
        vs_currency = request.args.get('vs_currency', 'usd')
        
        # Buscar dados históricos
        params = {
            'vs_currency': vs_currency,
            'days': days,
            'interval': 'daily'
        }
        
        response = requests.get(f"{COINGECKO_BASE_URL}/coins/{coin_id}/market_chart", params=params)
        if response.status_code != 200:
            return jsonify({"error": "Erro ao buscar dados históricos"}), 500
        
        data = response.json()
        
        # Extrair preços
        prices = [price[1] for price in data['prices']]
        volumes = [volume[1] for volume in data['total_volumes']]
        timestamps = [price[0] for price in data['prices']]
        
        # Para indicadores que precisam de high/low, usamos aproximações
        # Em dados reais, você teria OHLC data
        high_prices = prices  # Simplificação
        low_prices = prices   # Simplificação
        
        # Calcular indicadores técnicos
        analysis = {
            'coin_id': coin_id,
            'period': f"{days} days",
            'timestamps': timestamps,
            'prices': prices,
            'volumes': volumes,
            'indicators': {
                'sma_20': calculate_sma(prices, 20),
                'sma_50': calculate_sma(prices, 50),
                'ema_12': calculate_ema(prices, 12),
                'ema_26': calculate_ema(prices, 26),
                'rsi': calculate_rsi(prices),
                'bollinger_bands': calculate_bollinger_bands(prices),
                'macd': calculate_macd(prices),
                'stochastic': calculate_stochastic(high_prices, low_prices, prices)
            },
            'levels': detect_support_resistance(prices),
            'trend_analysis': {
                'overall_trend': analyze_trend(prices),
                'short_term_trend': analyze_trend(prices[-14:]) if len(prices) >= 14 else 'insufficient_data',
                'medium_term_trend': analyze_trend(prices[-30:]) if len(prices) >= 30 else 'insufficient_data'
            }
        }
        
        # Adicionar sinais de trading
        current_rsi = analysis['indicators']['rsi'][-1] if analysis['indicators']['rsi'] else None
        current_price = prices[-1]
        sma_20 = analysis['indicators']['sma_20'][-1] if analysis['indicators']['sma_20'] else None
        sma_50 = analysis['indicators']['sma_50'][-1] if analysis['indicators']['sma_50'] else None
        
        signals = []
        
        if current_rsi:
            if current_rsi > 70:
                signals.append({
                    'type': 'sell',
                    'indicator': 'RSI',
                    'message': f'RSI em {current_rsi:.2f} indica sobrecompra',
                    'strength': 'medium'
                })
            elif current_rsi < 30:
                signals.append({
                    'type': 'buy',
                    'indicator': 'RSI',
                    'message': f'RSI em {current_rsi:.2f} indica sobrevenda',
                    'strength': 'medium'
                })
        
        if sma_20 and sma_50:
            if current_price > sma_20 > sma_50:
                signals.append({
                    'type': 'buy',
                    'indicator': 'Moving Averages',
                    'message': 'Preço acima das médias móveis - tendência de alta',
                    'strength': 'strong'
                })
            elif current_price < sma_20 < sma_50:
                signals.append({
                    'type': 'sell',
                    'indicator': 'Moving Averages',
                    'message': 'Preço abaixo das médias móveis - tendência de baixa',
                    'strength': 'strong'
                })
        
        analysis['trading_signals'] = signals
        
        return jsonify(analysis)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@technical_bp.route('/indicators/<coin_id>', methods=['GET'])
def get_indicators(coin_id):
    """Retorna apenas os indicadores técnicos básicos"""
    try:
        days = request.args.get('days', '30')
        vs_currency = request.args.get('vs_currency', 'usd')
        
        params = {
            'vs_currency': vs_currency,
            'days': days,
            'interval': 'daily'
        }
        
        response = requests.get(f"{COINGECKO_BASE_URL}/coins/{coin_id}/market_chart", params=params)
        if response.status_code != 200:
            return jsonify({"error": "Erro ao buscar dados históricos"}), 500
        
        data = response.json()
        prices = [price[1] for price in data['prices']]
        
        indicators = {
            'current_price': prices[-1],
            'sma_20': calculate_sma(prices, 20)[-1] if len(prices) >= 20 else None,
            'ema_12': calculate_ema(prices, 12)[-1] if len(prices) >= 12 else None,
            'rsi': calculate_rsi(prices)[-1] if len(prices) >= 14 else None,
            'trend': analyze_trend(prices)
        }
        
        return jsonify(indicators)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@technical_bp.route('/compare', methods=['POST'])
def compare_coins():
    """Compara indicadores técnicos entre múltiplas moedas"""
    try:
        data = request.json
        coin_ids = data.get('coin_ids', [])
        days = data.get('days', '30')
        
        if not coin_ids:
            return jsonify({"error": "Lista de moedas não fornecida"}), 400
        
        comparison = {}
        
        for coin_id in coin_ids:
            params = {
                'vs_currency': 'usd',
                'days': days,
                'interval': 'daily'
            }
            
            response = requests.get(f"{COINGECKO_BASE_URL}/coins/{coin_id}/market_chart", params=params)
            if response.status_code == 200:
                coin_data = response.json()
                prices = [price[1] for price in coin_data['prices']]
                
                comparison[coin_id] = {
                    'current_price': prices[-1],
                    'price_change': ((prices[-1] - prices[0]) / prices[0]) * 100,
                    'rsi': calculate_rsi(prices)[-1] if len(prices) >= 14 else None,
                    'trend': analyze_trend(prices),
                    'volatility': np.std(prices) / np.mean(prices) * 100  # Coeficiente de variação
                }
        
        return jsonify(comparison)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@technical_bp.route('/screener', methods=['GET'])
def crypto_screener():
    """Screener de criptomoedas baseado em critérios técnicos"""
    try:
        # Buscar top 100 moedas
        response = requests.get(f"{COINGECKO_BASE_URL}/coins/markets", params={
            'vs_currency': 'usd',
            'order': 'market_cap_desc',
            'per_page': '100',
            'page': '1',
            'sparkline': 'false',
            'price_change_percentage': '24h,7d,30d'
        })
        
        if response.status_code != 200:
            return jsonify({"error": "Erro ao buscar dados de mercado"}), 500
        
        market_data = response.json()
        
        # Filtros
        min_volume = float(request.args.get('min_volume', '1000000'))  # $1M
        max_rsi = float(request.args.get('max_rsi', '70'))
        min_rsi = float(request.args.get('min_rsi', '30'))
        trend_filter = request.args.get('trend', 'all')  # all, bullish, bearish
        
        screened_coins = []
        
        for coin in market_data:
            # Filtro de volume
            if coin['total_volume'] < min_volume:
                continue
            
            # Buscar dados históricos para RSI
            try:
                hist_response = requests.get(f"{COINGECKO_BASE_URL}/coins/{coin['id']}/market_chart", params={
                    'vs_currency': 'usd',
                    'days': '30',
                    'interval': 'daily'
                })
                
                if hist_response.status_code == 200:
                    hist_data = hist_response.json()
                    prices = [price[1] for price in hist_data['prices']]
                    
                    if len(prices) >= 14:
                        rsi = calculate_rsi(prices)[-1]
                        trend = analyze_trend(prices)
                        
                        # Aplicar filtros
                        if rsi < min_rsi or rsi > max_rsi:
                            continue
                        
                        if trend_filter != 'all' and trend != trend_filter:
                            continue
                        
                        screened_coins.append({
                            'id': coin['id'],
                            'name': coin['name'],
                            'symbol': coin['symbol'],
                            'current_price': coin['current_price'],
                            'price_change_24h': coin['price_change_percentage_24h'],
                            'volume': coin['total_volume'],
                            'market_cap': coin['market_cap'],
                            'rsi': rsi,
                            'trend': trend
                        })
            except:
                continue  # Pular moedas com erro
        
        # Ordenar por volume
        screened_coins.sort(key=lambda x: x['volume'], reverse=True)
        
        return jsonify({
            'total_screened': len(screened_coins),
            'filters_applied': {
                'min_volume': min_volume,
                'rsi_range': [min_rsi, max_rsi],
                'trend': trend_filter
            },
            'coins': screened_coins[:50]  # Limitar a 50 resultados
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

