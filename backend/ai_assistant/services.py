"""
AI Services for RodoCheck
"""

import os
import json
import time
import base64
import requests
from typing import Dict, Any, Optional
from django.conf import settings
from django.utils import timezone
from .models import AIConfiguration, AIUsageLog
from authentication.models import User


class AIService:
    """Base class for AI services."""
    
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.config = self._get_configuration()
    
    def _get_configuration(self) -> Optional[AIConfiguration]:
        """Get AI service configuration."""
        try:
            return AIConfiguration.objects.get(service_name=self.service_name, is_active=True)
        except AIConfiguration.DoesNotExist:
            return None
    
    def _log_usage(self, user: User, model_name: str, input_tokens: int, 
                   output_tokens: int, processing_time: float, success: bool, 
                   error_message: str = ""):
        """Log AI service usage."""
        cost = self._calculate_cost(input_tokens, output_tokens)
        
        AIUsageLog.objects.create(
            user=user,
            service_name=self.service_name,
            model_name=model_name,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=cost,
            processing_time=processing_time,
            success=success,
            error_message=error_message
        )
    
    def _calculate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Calculate cost based on tokens (placeholder implementation)."""
        # This would be implemented based on actual pricing
        return (input_tokens * 0.001 + output_tokens * 0.002)


class OpenAIService(AIService):
    """OpenAI service implementation."""
    
    def __init__(self):
        super().__init__('openai')
        self.api_key = getattr(settings, 'OPENAI_API_KEY', '')
        self.base_url = 'https://api.openai.com/v1'
    
    def generate_response(self, prompt: str, user: User, model: str = 'gpt-3.5-turbo') -> Dict[str, Any]:
        """Generate AI response using OpenAI."""
        if not self.api_key:
            return {'success': False, 'error': 'OpenAI API key not configured'}
        
        start_time = time.time()
        
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'model': model,
                'messages': [{'role': 'user', 'content': prompt}],
                'max_tokens': 1000,
                'temperature': 0.7
            }
            
            response = requests.post(
                f'{self.base_url}/chat/completions',
                headers=headers,
                json=data,
                timeout=30
            )
            
            processing_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                usage = result.get('usage', {})
                
                self._log_usage(
                    user=user,
                    model_name=model,
                    input_tokens=usage.get('prompt_tokens', 0),
                    output_tokens=usage.get('completion_tokens', 0),
                    processing_time=processing_time,
                    success=True
                )
                
                return {
                    'success': True,
                    'response': result['choices'][0]['message']['content'],
                    'usage': usage,
                    'processing_time': processing_time
                }
            else:
                error_msg = f"OpenAI API error: {response.status_code} - {response.text}"
                self._log_usage(
                    user=user,
                    model_name=model,
                    input_tokens=0,
                    output_tokens=0,
                    processing_time=processing_time,
                    success=False,
                    error_message=error_msg
                )
                
                return {'success': False, 'error': error_msg}
                
        except Exception as e:
            processing_time = time.time() - start_time
            error_msg = f"OpenAI service error: {str(e)}"
            
            self._log_usage(
                user=user,
                model_name=model,
                input_tokens=0,
                output_tokens=0,
                processing_time=processing_time,
                success=False,
                error_message=error_msg
            )
            
            return {'success': False, 'error': error_msg}
    
    def analyze_image(self, image_base64: str, prompt: str, user: User, model: str = 'gpt-4-vision-preview') -> Dict[str, Any]:
        """Analyze image using OpenAI Vision."""
        if not self.api_key:
            return {'success': False, 'error': 'OpenAI API key not configured'}
        
        start_time = time.time()
        
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'model': model,
                'messages': [{
                    'role': 'user',
                    'content': [
                        {'type': 'text', 'text': prompt},
                        {
                            'type': 'image_url',
                            'image_url': {
                                'url': f'data:image/jpeg;base64,{image_base64}'
                            }
                        }
                    ]
                }],
                'max_tokens': 1000,
                'temperature': 0.3
            }
            
            response = requests.post(
                f'{self.base_url}/chat/completions',
                headers=headers,
                json=data,
                timeout=60
            )
            
            processing_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                usage = result.get('usage', {})
                
                self._log_usage(
                    user=user,
                    model_name=model,
                    input_tokens=usage.get('prompt_tokens', 0),
                    output_tokens=usage.get('completion_tokens', 0),
                    processing_time=processing_time,
                    success=True
                )
                
                return {
                    'success': True,
                    'response': result['choices'][0]['message']['content'],
                    'usage': usage,
                    'processing_time': processing_time
                }
            else:
                error_msg = f"OpenAI Vision API error: {response.status_code} - {response.text}"
                self._log_usage(
                    user=user,
                    model_name=model,
                    input_tokens=0,
                    output_tokens=0,
                    processing_time=processing_time,
                    success=False,
                    error_message=error_msg
                )
                
                return {'success': False, 'error': error_msg}
                
        except Exception as e:
            processing_time = time.time() - start_time
            error_msg = f"OpenAI Vision service error: {str(e)}"
            
            self._log_usage(
                user=user,
                model_name=model,
                input_tokens=0,
                output_tokens=0,
                processing_time=processing_time,
                success=False,
                error_message=error_msg
            )
            
            return {'success': False, 'error': error_msg}


class GoogleAIService(AIService):
    """Google AI service implementation."""
    
    def __init__(self):
        super().__init__('google_ai')
        self.api_key = getattr(settings, 'GOOGLE_AI_API_KEY', '')
        self.base_url = 'https://generativelanguage.googleapis.com/v1beta'
    
    def generate_response(self, prompt: str, user: User, model: str = 'gemini-pro') -> Dict[str, Any]:
        """Generate response using Google AI."""
        if not self.api_key:
            return {'success': False, 'error': 'Google AI API key not configured'}
        
        start_time = time.time()
        
        try:
            url = f'{self.base_url}/models/{model}:generateContent'
            headers = {
                'Content-Type': 'application/json',
            }
            
            data = {
                'contents': [{
                    'parts': [{'text': prompt}]
                }],
                'generationConfig': {
                    'temperature': 0.7,
                    'maxOutputTokens': 1000
                }
            }
            
            response = requests.post(
                url,
                headers=headers,
                json=data,
                params={'key': self.api_key},
                timeout=30
            )
            
            processing_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                
                self._log_usage(
                    user=user,
                    model_name=model,
                    input_tokens=len(prompt.split()),  # Approximate
                    output_tokens=len(result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '').split()),
                    processing_time=processing_time,
                    success=True
                )
                
                return {
                    'success': True,
                    'response': result['candidates'][0]['content']['parts'][0]['text'],
                    'processing_time': processing_time
                }
            else:
                error_msg = f"Google AI API error: {response.status_code} - {response.text}"
                self._log_usage(
                    user=user,
                    model_name=model,
                    input_tokens=0,
                    output_tokens=0,
                    processing_time=processing_time,
                    success=False,
                    error_message=error_msg
                )
                
                return {'success': False, 'error': error_msg}
                
        except Exception as e:
            processing_time = time.time() - start_time
            error_msg = f"Google AI service error: {str(e)}"
            
            self._log_usage(
                user=user,
                model_name=model,
                input_tokens=0,
                output_tokens=0,
                processing_time=processing_time,
                success=False,
                error_message=error_msg
            )
            
            return {'success': False, 'error': error_msg}


class AIAssistantService:
    """Service for AI assistant functionality."""
    
    def __init__(self):
        self.openai_service = OpenAIService()
        self.google_service = GoogleAIService()
    
    def get_ai_service(self) -> AIService:
        """Get the preferred AI service."""
        # Try OpenAI first, fallback to Google AI
        if self.openai_service.api_key:
            return self.openai_service
        elif self.google_service.api_key:
            return self.google_service
        else:
            raise Exception("No AI service configured")
    
    def process_assistant_query(self, query: str, user: User, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process assistant query with context."""
        try:
            ai_service = self.get_ai_service()
            
            # Build context-aware prompt
            prompt = self._build_assistant_prompt(query, context or {})
            
            # Get AI response
            result = ai_service.generate_response(prompt, user)
            
            if result['success']:
                # Parse response for actions
                response_data = self._parse_assistant_response(result['response'])
                return {
                    'success': True,
                    'data': response_data,
                    'processing_time': result.get('processing_time', 0)
                }
            else:
                return result
                
        except Exception as e:
            return {'success': False, 'error': f'Assistant service error: {str(e)}'}
    
    def _build_assistant_prompt(self, query: str, context: Dict[str, Any]) -> str:
        """Build context-aware prompt for assistant."""
        prompt = f"""Você é um assistente inteligente para RodoCheck, um sistema de gestão de frotas. 
Sua função é ajudar usuários a navegar, responder perguntas e dar insights com base nos dados do sistema.

Pergunta do usuário: "{query}"

Contexto do sistema:
{json.dumps(context, indent=2, ensure_ascii=False)}

Páginas disponíveis:
- /dashboard: Dashboard principal
- /checklist/manutencao: Criar checklist de manutenção
- /consultas: Buscar checklists anteriores
- /relatorios: Gerar relatórios
- /manutencoes: Ver e agendar manutenções
- /usuarios: Gerenciar usuários
- /veiculos: Gerenciar veículos
- /pneus: Gerenciar pneus

Responda de forma clara, profissional e objetiva. Se o usuário pedir para navegar para uma página, 
responda com "navigate" e a URL. Se pedir suporte, responda com "link" e o WhatsApp.
"""
        return prompt
    
    def _parse_assistant_response(self, response: str) -> Dict[str, Any]:
        """Parse assistant response for actions."""
        # Simple parsing - in production, this would be more sophisticated
        if "navigate" in response.lower() or "ir para" in response.lower():
            # Extract navigation target
            if "dashboard" in response.lower():
                return {"response": response, "action": "navigate", "payload": "/dashboard"}
            elif "checklist" in response.lower():
                return {"response": response, "action": "navigate", "payload": "/checklist/manutencao"}
            elif "relatório" in response.lower():
                return {"response": response, "action": "navigate", "payload": "/relatorios"}
            elif "usuário" in response.lower():
                return {"response": response, "action": "navigate", "payload": "/usuarios"}
            elif "veículo" in response.lower():
                return {"response": response, "action": "navigate", "payload": "/veiculos"}
            elif "pneu" in response.lower():
                return {"response": response, "action": "navigate", "payload": "/pneus"}
        
        if "suporte" in response.lower() or "whatsapp" in response.lower():
            return {
                "response": response, 
                "action": "link", 
                "payload": "https://wa.me/5511999999999"
            }
        
        return {"response": response, "action": "none"}
    
    def assess_vehicle_damage(self, image_base64: str, checklist_id: str, vehicle_id: str, user: User) -> Dict[str, Any]:
        """Assess vehicle damage using AI."""
        try:
            ai_service = self.get_ai_service()
            
            prompt = f"""Analise esta imagem de veículo para detectar danos não registrados anteriormente.
ID do Checklist: {checklist_id}
ID do Veículo: {vehicle_id}

Procure por:
- Arranhões ou amassados
- Rachaduras no vidro
- Danos na pintura
- Peças soltas ou faltando
- Sinais de colisão

Responda em JSON com:
- damageDetected: true/false
- damageDescription: descrição dos danos encontrados (se houver)
"""
            
            if hasattr(ai_service, 'analyze_image'):
                result = ai_service.analyze_image(image_base64, prompt, user)
            else:
                # Fallback to text-based analysis
                result = ai_service.generate_response(prompt, user)
            
            if result['success']:
                # Parse the response
                response_text = result['response']
                try:
                    # Try to parse as JSON
                    damage_data = json.loads(response_text)
                except:
                    # Fallback parsing
                    damage_data = {
                        'damageDetected': 'danos' in response_text.lower() or 'damage' in response_text.lower(),
                        'damageDescription': response_text if 'danos' in response_text.lower() else ''
                    }
                
                return {
                    'success': True,
                    'data': damage_data,
                    'processing_time': result.get('processing_time', 0)
                }
            else:
                return result
                
        except Exception as e:
            return {'success': False, 'error': f'Damage assessment error: {str(e)}'}

