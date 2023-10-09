import nodemailer from 'nodemailer'

const emailRegistro = async (datos) => {

    const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
    });

    const {nombre, email, token} = datos

    //enviar email
    await transport.sendMail({
        from: 'BienesRaices.com',
        to: email,
        subject: 'Confirma tu cuenta en BienesRaices.com',
        text: 'Confirma tu cuenta en BienesRaices.com',
        html: `
        <p>Hola ${nombre}, comprueba tu nombre en bienesraices.com</p>

        <p>Tu cuenta ya esta lista, solo debes dar click al siguiente enlace: 
        <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/confirmar/${token}">Confirmar Cuenta</a></p>

        <p> Si tu no creaste la cuenta ignora el mensaje<p/>
        `
    })
}

const emailOlvidePassword = async (datos) => {

    const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
    });

    const {nombre, email, token} = datos

    //enviar email
    await transport.sendMail({
        from: 'BienesRaices.com',
        to: email,
        subject: 'Restable tu password en BienesRaices.com',
        text: 'Restable tu password en BienesRaices.com',
        html: `
        <p>Hola ${nombre}, Haz solicitado restablecer tu password en bienesraices.com</p>

        <p>Sigue el siguiente enlace para crear un password nuevo: 
        <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/olvide-password/${token}">Restablecer password</a></p>

        <p> Si tu no solicitaste el cambio ignora el mensaje<p/>
        `
    })
}

export {
    emailRegistro,
    emailOlvidePassword
}