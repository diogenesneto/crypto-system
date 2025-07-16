from flask import Blueprint, jsonify, request
import requests
import time
from datetime import datetime, timedelta

crypto_bp = Blueprint('crypto', __name__)

# Base URL da API CoinGecko
COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"

@crypto_bp.route('/coins/list', methods=['GET'])
def get_coins_list():
    """Retorna lista de todas as criptomoedas disponíveis"""
    try:
        response = requests.get(f"{COINGECKO_BASE_URL}/coins/list")
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Erro ao buscar lista de moedas"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@crypto_bp.route('/coins/markets', methods=['GET'])
def get_market_data():
    """Retorna dados de mercado das principais criptomoedas"""
    try:
        # Parâmetros opcionais
        vs_currency = request.args.get('vs_currency', 'usd')
        per_page = request.args.get('per_page', '100')
        page = request.args.get('page', '1')
        
        params = {
            'vs_currency': vs_currency,
            'order': 'market_cap_desc',
            'per_page': per_page,
            'page': page,
            'sparkline': 'true',
            'price_change_percentage': '1h,24h,7d,30d'
        }
        
        response = requests.get(f"{COINGECKO_BASE_URL}/coins/markets", params=params)
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Erro ao buscar dados de mercado"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@crypto_bp.route('/coins/<coin_id>', methods=['GET'])
def get_coin_details(coin_id):
    """Retorna detalhes específicos de uma criptomoeda"""
    try:
        params = {
            'localization': 'false',
            'tickers': 'false',
            'market_data': 'true',
            'community_data': 'true',
            'developer_data': 'true',
            'sparkline': 'true'
        }
        
        response = requests.get(f"{COINGECKO_BASE_URL}/coins/{coin_id}", params=params)
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Erro ao buscar detalhes da moeda"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@crypto_bp.route('/coins/<coin_id>/history', methods=['GET'])
def get_coin_history(coin_id):
    """Retorna dados históricos de uma criptomoeda"""
    try:
        vs_currency = request.args.get('vs_currency', 'usd')
        days = request.args.get('days', '30')
        interval = request.args.get('interval', 'daily')
        
        params = {
            'vs_currency': vs_currency,
            'days': days,
            'interval': interval
        }
        
        response = requests.get(f"{COINGECKO_BASE_URL}/coins/{coin_id}/market_chart", params=params)
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Erro ao buscar dados históricos"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@crypto_bp.route('/global', methods=['GET'])
def get_global_data():
    """Retorna dados globais do mercado de criptomoedas"""
    try:
        response = requests.get(f"{COINGECKO_BASE_URL}/global")
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Erro ao buscar dados globais"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@crypto_bp.route('/trending', methods=['GET'])
def get_trending():
    """Retorna as criptomoedas em tendência"""
    try:
        response = requests.get(f"{COINGECKO_BASE_URL}/search/trending")
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Erro ao buscar tendências"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@crypto_bp.route('/fear-greed', methods=['GET'])
def get_fear_greed_index():
    """Retorna o índice de medo e ganância"""
    try:
        # API alternativa para Fear & Greed Index
        response = requests.get("https://api.alternative.me/fng/")
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Erro ao buscar índice de medo e ganância"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@crypto_bp.route('/exchanges', methods=['GET'])
def get_exchanges():
    """Retorna lista de exchanges"""
    try:
        per_page = request.args.get('per_page', '50')
        page = request.args.get('page', '1')
        
        params = {
            'per_page': per_page,
            'page': page
        }
        
        response = requests.get(f"{COINGECKO_BASE_URL}/exchanges", params=params)
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Erro ao buscar exchanges"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@crypto_bp.route('/portfolio/analyze', methods=['POST'])
def analyze_portfolio():
    """Analisa um portfólio de criptomoedas"""
    try:
        data = request.json
        holdings = data.get('holdings', [])
        
        if not holdings:
            return jsonify({"error": "Nenhuma holding fornecida"}), 400
        
        portfolio_analysis = {
            'total_value': 0,
            'total_change_24h': 0,
            'holdings_analysis': [],
            'diversification': {},
            'risk_metrics': {}
        }
        
        for holding in holdings:
            coin_id = holding.get('coin_id')
            amount = holding.get('amount', 0)
            
            # Buscar dados atuais da moeda
            response = requests.get(f"{COINGECKO_BASE_URL}/coins/{coin_id}")
            if response.status_code == 200:
                coin_data = response.json()
                current_price = coin_data['market_data']['current_price']['usd']
                price_change_24h = coin_data['market_data']['price_change_percentage_24h']
                
                holding_value = amount * current_price
                holding_change_24h = holding_value * (price_change_24h / 100)
                
                portfolio_analysis['total_value'] += holding_value
                portfolio_analysis['total_change_24h'] += holding_change_24h
                
                portfolio_analysis['holdings_analysis'].append({
                    'coin_id': coin_id,
                    'name': coin_data['name'],
                    'symbol': coin_data['symbol'],
                    'amount': amount,
                    'current_price': current_price,
                    'holding_value': holding_value,
                    'price_change_24h': price_change_24h,
                    'holding_change_24h': holding_change_24h
                })
        
        # Calcular percentual de mudança total
        if portfolio_analysis['total_value'] > 0:
            portfolio_analysis['total_change_percentage_24h'] = (
                portfolio_analysis['total_change_24h'] / 
                (portfolio_analysis['total_value'] - portfolio_analysis['total_change_24h'])
            ) * 100
        
        return jsonify(portfolio_analysis)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

