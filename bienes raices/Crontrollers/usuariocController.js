import { check, validationResult } from 'express-validator'
import bcrypt from 'bcrypt'
import Usuario from '../models/Usuario.js'
import { generarJWT, generarId } from '../helpers/tokens.js'
import { emailRegistro, emailOlvidePassword } from '../helpers/emails.js'

const formularioLogin = (req, res) => {
    res.render('auth/login', {
        pagina: 'Iniciar Seción',
        csrfToken : req.csrfToken()
    })
}
const autenticar = async (req, res) => {
    //Validacion
    await check('email').isEmail().withMessage('Eso no parece un Email').run(req)
    await check('password').notEmpty().withMessage('El Password es Obligatorio').run(req)

    let resultado = validationResult(req)

    //Verificar que el usuario esta vacio
    if(!resultado.isEmpty()) {
        //errores
        return res.render('auth/login', {
            pagina: 'Iniciar Seción',
            csrfToken : req.csrfToken(),
            errores: resultado.array()
        })

    }


    const { email, password } = req.body

    //Comprobar si el usuario existe
    const usuario = await Usuario.findOne({where: { email }})

    if(!usuario) {
        return res.render('auth/login', {
            pagina: 'Iniciar Seción',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'El usuario NO Existe'}]
        })
    }

    //Comprobar que el usuario esta confirmado
    if(!usuario.confirmado) {
        return res.render('auth/login', {
            pagina: 'Iniciar Seción',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'Tu cuenta NO Esta Confirmado'}]
        })
    } 

    //Revisar el password
    if(!usuario.verificarPassword(password)) {
        return res.render('auth/login', {
            pagina: 'Iniciar Seción',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'El password es Incorrecto'}]
        })
    } 

    //Autenticar usuario

    const token = generarJWT({id: usuario.id, nombre: usuario.nombre})

    console.log(token)

    //almacenar cookies

    return res.cookie('_token', token, {
        httpOnly: true,
        // secure: true,
        // sameSite: true
    }).redirect('/mis-propiedades')

}
const cerrarSesion = (req, res) => {
    return res.clearCookie('_token').status(200).redirect('/')
}

const formularioRegistro = (req, res) => {
    res.render('auth/registro', {
        pagina: 'Crear Cuenta',
        csrfToken : req.csrfToken()
    })
}

const registrar = async (req, res) => {
    //Validacion
    await check('nombre').notEmpty().withMessage('Nombre es obligatorio').run(req)
    await check('email').isEmail().withMessage('Eso no parece un Email').run(req)
    await check('password').isLength({ min: 6 }).withMessage('Minimo 6 caracteres').run(req)
    await check('repetir_password').equals(req.body.password).withMessage('Los password no son iguales').run(req)

    let resultado = validationResult(req)

    //Verificar que el usuario esta vacio
    if(!resultado.isEmpty()) {
        //errores
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken : req.csrfToken(),
            errores: resultado.array(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })

    }
    //Extraer datos
    const {nombre, email, password} = req.body

    //Verificar que el usuario no este registrado
    const existeUsuario = await Usuario.findOne( { where : {email} } )

    if(existeUsuario) {
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'El usuario ya esta registrado'}],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }

    //Almacenar Usuario
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    })
    //Enviar email al usuario
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })


    //Mostrar Mensaje de confirmacion
    res.render('template/mensaje', {
        pagina: 'Cuenta creada Correctamente',
        mensaje: 'Correo de confirmacion enviado, presione el enlace de confirmacion '
    })

}

//Confirmar una cuenta
const confirmar = async (req, res) => {
    const {token} = req.params;
    //Verificar si el token es valido
    const usuario = await Usuario.findOne({where: {token}})

    if(!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Error al confirmar la cuenta',
            mensaje: 'Hubo un error al confirmar la cuenta, intenta de nuevo ',
            error: true        
        })
    }
    //Confirmar la cuenta
    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Cuenta corfimada',
        mensaje: 'La Cuenta se confirmó correctamente',
        error: false        
    })


}

const formularioOlvidePassword = (req, res) => {
    res.render('auth/olvide-password', {
        pagina: 'Recuperar Contraseña',
        csrfToken : req.csrfToken(),
    })
}

const resetPassword = async (req, res) => {
    //Validacion
    await check('email').isEmail().withMessage('Eso no parece un Email').run(req)

    let resultado = validationResult(req)



    //Verificar que el usuario esta vacio
    if(!resultado.isEmpty()) {
        //errores
        return res.render('auth/olvide-password', {
            pagina: 'Recuperar Contraseña',
            csrfToken : req.csrfToken(),
            errores: resultado.array()
        })

    }

    //Buscar usuario
    const { email } = req.body

    const usuario = await Usuario.findOne( { where : {email} } )
    if(!usuario) {
        return res.render('auth/olvide-password', {
            pagina: 'Recuperar Contraseña',
            csrfToken : req.csrfToken(),
            errores: [{msg : 'El email no esta registrado'}]
        })
    }


    //Generar un token y enviar el email
    usuario.token = generarId();
    await usuario.save();

    //enviar email
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    })
    //Mostrar Mensaje de confirmacion
    res.render('template/mensaje', {
        pagina: 'Restable tu password',
        mensaje: 'Hemos enviado un email con las instrucciones'
    })
}

const comprobarToken = async (req, res) => {
    const { token } = req.params;

    const usuario = await Usuario.findOne({where: {token}})

    if(!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Restablece passwors',
            mensaje: 'Hubo un error al al validar informacion, intenta de nuevo ',
            error: true        
        })
    }

    //Mostrar formulario para modificar el password
    res.render('auth/reset-password', {
        pagina: 'Restablece tu Password',
        csrfToken : req.csrfToken()
    })

}

const nuevoPassword = async (req, res) => {
    //validar password
    await check('password').isLength({ min: 6 }).withMessage('Minimo 6 caracteres').run(req)

    let resultado = validationResult(req)

    //Verificar que el usuario esta vacio
    if(!resultado.isEmpty()) {
        //errores
        return res.render('auth/reset-password', {
            pagina: 'Restablece tu Password',
            csrfToken : req.csrfToken(),
            errores: resultado.array()
        })

    }
    const { token } = req.params;
    const { password } = req.body;

    //Identificar quien hace el cambio
    const usuario = await Usuario.findOne({where: {token}})

    console.log(usuario)


    //Hashear el nuevo password
    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash(password, salt);
    usuario.token = null

    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Password Reestablecida',
        mensaje: 'Se ha realizado con exito'
    })
}


export {
    formularioLogin,
    autenticar,
    cerrarSesion,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword
}

