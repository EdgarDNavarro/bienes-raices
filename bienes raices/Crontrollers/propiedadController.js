import { validationResult } from "express-validator";
import { unlink } from "node:fs/promises"
import { Categoria, Precio, Propiedad, Mensaje, Usuario } from '../models/index.js'
import { where } from "sequelize";
import { esVendedor, formatearFecha } from '../helpers/index.js'


const admin = async (req, res) => {

    //Leer queryString
    const {pagina: paginaActual} = req.query
    const expresion = /^[1-9]$/

    if(!expresion.test(paginaActual)) {
        return res.redirect('/mis-propiedades?pagina=1')
    }

    try {

        const { id } = req.usuario

        //Limites y Offset para le paginador 
        const limit = 5
        const offset = ((paginaActual * limit) - limit)

    
        const [propiedades, total] = await Promise.all([
            Propiedad.findAll({
                limit,
                offset,
                where: {
                    usuarioId: id
                },
                include: [
                    { model: Categoria, as: 'categoria' },
                    { model: Precio, as: 'precio' },
                    { model: Mensaje, as: 'mensajes' },
                ]
            }),
            Propiedad.count({
                where: {
                    usuarioId: id
                }
            })
        ])

        res.render('propiedades/admin', {
            pagina: 'Mis Propiedades',
            csrfToken: req.csrfToken(),
            propiedades,
            paginas: Math.ceil(total / limit),
            paginaActual: Number(paginaActual),
            total,
            offset,
            limit
        })

    } catch (error) {
        console.log(error)
    }
}
//Formulario para crear una nueva propiedad 
const crear = async (req, res) => {
    //Consultar modelo de Precio y Categoria
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('propiedades/crear', {
        pagina: 'Crear Propiedad',
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: {}
    })
}

const guardar = async (req, res) => {
    
    //Resultadio de la validacion
    let resultado = validationResult(req)

    if(!resultado.isEmpty()) {

        //Consultar modelo de Precio y Categoria
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

        return res.render('propiedades/crear', {
        pagina: 'Crear Propiedad',
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        errores: resultado.array(),
        datos: req.body
        })
    }

    //Crear un registro

    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, categoria: categoriaId, precio: precioId} = req.body

    const { id: usuarioId } = req.usuario

    try {
        const propiedadGuardada = await Propiedad.create({
            titulo, 
            descripcion, 
            habitaciones, 
            estacionamiento, 
            wc, 
            calle, 
            lat, 
            lng,
            categoriaId,
            precioId,
            usuarioId,
            imagen: ''
        })

        const { id } = propiedadGuardada

        res.redirect(`/propiedades/agregar-imagen/${id}`)

    } catch (error) {
        console.log(error)
    }

}

const agregarImagen = async (req, res) => {
        
    const { id } = req.params
    //Validar que la propiedad exista 
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    //Validar que la propiedad no este publicada
    if(propiedad.publicado) {
        return res.redirect('/mis-propiedades')   
    }

    //Validar que la propiedad sea de quien visita la pagina
    if( req.usuario.id.toString() !== propiedad.usuarioId.toString() ) {
        return res.redirect('/mis-propiedades') 
    }

    res.render('propiedades/agregar-imagen', {
        pagina: `Agregar Imagen: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        propiedad
    })



}

const almacenarImagen =  async (req, res, next) => {

    const { id } = req.params
    //Validar que la propiedad exista 
    const propiedad = await Propiedad.findByPk(id)


    if(!propiedad) {

        return res.redirect('/mis-propiedades')
    }

    //Validar que la propiedad no este publicada
    if(propiedad.publicado) {

        return res.redirect('/mis-propiedades')   
    }

    //Validar que la propiedad sea de quien visita la pagina
    if( req.usuario.id.toString() !== propiedad.usuarioId.toString() ) {

        return res.redirect('/mis-propiedades') 
    }

    try {
        // console.log(req.file)

        //Almacenar imagen y publicar propiedad
        propiedad.imagen = req.file.filename
        propiedad.publicado = 1

        await propiedad.save()

        next()
        
    } catch (error) {
        console.log(error)
    }

}

const editar =  async(req, res) => {

    const {id} = req.params

    //validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad) {
        return res.redirect('/mis-propiedades') 
    }
    //Revisar que quien visita la URL es quien creo la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades') 
    }

    //Consultar modelo de Precio y Categoria
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('propiedades/editar', {
        pagina: `Editar Propiedad: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: propiedad
    })
}

const guardarCambios = async (req, res) => {
    //Verificar la validacion
    let resultado = validationResult(req)

    if(!resultado.isEmpty()) {

        //Consultar modelo de Precio y Categoria
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

        return res.render('propiedades/editar', {
        pagina: `Editar Propiedad`,
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        errores: resultado.array(),
        datos: req.body
    })
    }


    const {id} = req.params

    //validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)
    
    if(!propiedad) {
        return res.redirect('/mis-propiedades') 
    }
    //Revisar que quien visita la URL es quien creo la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades') 
    }

    //Reescribir el objeto y actulizarlo
    try {
    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, categoria: categoriaId, precio: precioId} = req.body

    propiedad.set({
        titulo, 
        descripcion, 
        habitaciones, 
        estacionamiento, 
        wc, 
        calle, 
        lat, 
        lng,
        categoriaId,
        precioId
    })
    await propiedad.save()

    res.redirect('mis-propiedades')

    } catch (error) {
        console.log(error)
    }
}

const eliminar = async (req, res) => {
    const {id} = req.params

    //validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad) {
        return res.redirect('/mis-propiedades') 
    }
    //Revisar que quien visita la URL es quien creo la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades') 
    }

    //Eliminar la imagen
    await unlink(`public/uploads/${propiedad.imagen}`)
    console.log(`se eliminó la imagen ${propiedad.imagen}`)

    //Eliminar la propiedad

    await propiedad.destroy()
    res.redirect('/mis-propiedades')
}

//Cambiar estado de la propiedad
const cambiarEstado = async (req, res) => {
    
    const {id} = req.params

    //validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad) {
        return res.redirect('/mis-propiedades') 
    }
    //Revisar que quien visita la URL es quien creo la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades') 
    }

    //actualizar
    propiedad.publicado = !propiedad.publicado
    await propiedad.save()
    res.json({
        resultado: true
    })
}

const mostarPropiedad = async (req, res) => {
    const { id } = req.params

    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Categoria, as: 'categoria' },
            { model: Precio, as: 'precio' }
        ]
    })


    if(!propiedad || !propiedad.publicado) {
        return res.redirect('/404')
    }

    res.render('propiedades/mostrar', {
        propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId)
    })
}

const enviarMensaje = async (req, res) => {
    const { id } = req.params

    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Categoria, as: 'categoria' },
            { model: Precio, as: 'precio' }
        ]
    })



    if(!propiedad) {
        return res.redirect('/404')
    }
    //Renderizar los errores
        //Resultadio de la validacion
    let resultado = validationResult(req)

    if(!resultado.isEmpty()) {

        return res.render('propiedades/mostrar', {
            propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
            errores: resultado.array()
        })
    }
    //Almacenar el mensaje
    const { mensaje } = req.body
    const { id: propiedadId } = req.params
    const { id: usuarioId } = req.usuario

    await Mensaje.create({
        mensaje,
        propiedadId,
        usuarioId
    })

    res.redirect('/')
}

//Leer mensaje
const verMensaje = async (req, res) => {

    const {id} = req.params

    //validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Mensaje, as: 'mensajes',
                include: [
                    { model: Usuario.scope('eliminarPassword'), as: 'usuario' }
                ]
            }
        ]
    })

    if(!propiedad) {
        return res.redirect('/mis-propiedades') 
    }
    //Revisar que quien visita la URL es quien creo la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades') 
    }
    

    res.render('propiedades/mensajes', {
        pagina: 'Mensajes',
        mensajes: propiedad.mensajes,
        formatearFecha
    })
}


export {
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
    editar,
    guardarCambios,
    eliminar,
    cambiarEstado,
    mostarPropiedad,
    enviarMensaje,
    verMensaje
}