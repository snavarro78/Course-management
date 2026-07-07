import sys
import os
 
# Agregar la carpeta del proyecto al path de Python
sys.path.insert(0, os.path.dirname(__file__))
 
# Cargar variables de entorno desde .env
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
 
# Importar la app FastAPI
from app import app as fastapi_app
 
# Adaptar ASGI → WSGI usando asgiref
from asgiref.wsgi import WsgiToAsgi
application = WsgiToAsgi(fastapi_app)