from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional
from datetime import date
import re


# ════════════════════════════════════════════════════════
#  CLASES_PUESTO
# ════════════════════════════════════════════════════════
class ClasePuestoBase(BaseModel):
    nombre_clase: str

class ClasePuestoCreate(ClasePuestoBase):
    pass

class ClasePuestoUpdate(BaseModel):
    nombre_clase: Optional[str] = None

class ClasePuestoResponse(ClasePuestoBase):
    id_clase_puesto: int
    model_config = ConfigDict(from_attributes=True)


# ════════════════════════════════════════════════════════
#  ESTRATOS
# ════════════════════════════════════════════════════════
class EstratoBase(BaseModel):
    nombre_estrato: str

class EstratoCreate(EstratoBase):
    pass

class EstratoUpdate(BaseModel):
    nombre_estrato: Optional[str] = None

class EstratoResponse(EstratoBase):
    id_estrato: int
    model_config = ConfigDict(from_attributes=True)


# ════════════════════════════════════════════════════════
#  PERSONAS
# ════════════════════════════════════════════════════════
class PersonaBase(BaseModel):
    cedula: str
    nombre: str
    apellidos: str
    email: Optional[EmailStr] = None
    rol: str
    direccion_regional_oficina: Optional[str] = None  # nombre correcto del campo
    sexo: Optional[str] = None
    id_estrato: Optional[int] = None
    id_clase_puesto: Optional[int] = None

    @field_validator("cedula")
    @classmethod
    def cedula_valida(cls, v: str) -> str:
        if not re.match(r"^\d{5,15}$", v):
            raise ValueError("Cédula debe contener solo dígitos (5-15 caracteres)")
        return v

    @field_validator("rol")
    @classmethod
    def rol_valido(cls, v: str) -> str:
        if v not in ("usuario", "admin", "mediador", "sub_admin"):
            raise ValueError("Rol debe ser 'usuario', 'admin', 'mediador' o 'sub_admin'")
        return v

    @field_validator("sexo")
    @classmethod
    def sexo_valido(cls, v: Optional[str]) -> Optional[str]:
        return v  # acepta cualquier valor que esté en la BD


class PersonaCreate(PersonaBase):
    contra: str

    @field_validator("email")
    @classmethod
    def email_dominio_valido(cls, v) -> str:
        if v and not str(v).endswith("@mep.go.cr"):
            raise ValueError("El correo debe pertenecer al dominio @mep.go.cr")
        return v

    @field_validator("contra")
    @classmethod
    def password_seguro(cls, v: str) -> str:
        if len(v) < 12:
            raise ValueError("La contraseña debe tener al menos 12 caracteres")
        if not re.search(r"[A-Z]", v):
            raise ValueError("La contraseña debe tener al menos una letra mayúscula")
        if not re.search(r"\d", v):
            raise ValueError("La contraseña debe tener al menos un número")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]", v):
            raise ValueError("La contraseña debe tener al menos un carácter especial (!@#$%...)")
        return v


class PersonaUpdate(BaseModel):
    cedula: Optional[str] = None
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    email: Optional[EmailStr] = None
    contra: Optional[str] = None
    rol: Optional[str] = None
    direccion_regional_oficina: Optional[str] = None  # nombre correcto del campo
    sexo: Optional[str] = None
    id_estrato: Optional[int] = None
    id_clase_puesto: Optional[int] = None


class PersonaResponse(PersonaBase):
    id_persona: int
    # contra NUNCA se devuelve en la respuesta
    model_config = ConfigDict(from_attributes=True)


# ════════════════════════════════════════════════════════
#  CURSOS
# ════════════════════════════════════════════════════════
class CursoBase(BaseModel):
    consecutivo: str
    nombre_curso: str
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None

class CursoCreate(CursoBase):
    pass

class CursoUpdate(BaseModel):
    consecutivo: Optional[str] = None
    nombre_curso: Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None

class CursoResponse(CursoBase):
    id_curso: int
    model_config = ConfigDict(from_attributes=True)


# ════════════════════════════════════════════════════════
#  MATRICULAS
# ════════════════════════════════════════════════════════
class MatriculaBase(BaseModel):
    id_persona: int
    id_curso: int
    estado: Optional[str] = None

    @field_validator("estado")
    @classmethod
    def estado_valido(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in ("aprobado", "desaprobado"):
            raise ValueError("Estado debe ser 'aprobado' o 'desaprobado'")
        return v

class MatriculaCreate(MatriculaBase):
    pass

class MatriculaUpdate(BaseModel):
    id_persona: Optional[int] = None
    id_curso: Optional[int] = None
    estado: Optional[str] = None

class PersonaSimple(BaseModel):
    id_persona: int
    cedula: Optional[str] = None
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    email: Optional[str] = None
    rol: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class MatriculaResponse(MatriculaBase):
    id_matricula: int
    personas: Optional[PersonaSimple] = None
    model_config = ConfigDict(from_attributes=True)


# ════════════════════════════════════════════════════════
#  AUTH
# ════════════════════════════════════════════════════════
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    rol: Optional[str] = None

class TokenData(BaseModel):
    id_persona: Optional[int] = None
    email: Optional[str] = None
    rol: Optional[str] = None


# ════════════════════════════════════════════════════════
#  CURSO_MEDIADORES
# ════════════════════════════════════════════════════════
class CursoMediadorBase(BaseModel):
    id_curso: int
    id_persona: int  # persona con rol='mediador'

class CursoMediadorCreate(CursoMediadorBase):
    pass

class CursoMediadorResponse(CursoMediadorBase):
    id_curso_mediador: int
    model_config = ConfigDict(from_attributes=True)