import bcrypt from 'bcrypt'

const usuarios = [
    {
        nombre: 'Daniel',
        email: 'daniel@daniel.com',
        confirmado: 1,
        password: bcrypt.hashSync('21210703', 10)
    }
]

export default usuarios