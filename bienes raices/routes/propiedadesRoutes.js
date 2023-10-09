import express from "express";
import { body } from "express-validator";
import { admin, crear, guardar, agregarImagen, almacenarImagen, editar, guardarCambios, eliminar, cambiarEstado, mostarPropiedad, enviarMensaje, verMensaje } from "../Crontrollers/propiedadController.js";
import protegerRuta from "../middleware/protegerRuta.js";
import upload from '../middleware/subirimg.js';
import identificarUsuario from '../middleware/indentificarUsuario.js'


const router = express.Router()

router.get('/mis-propiedades', protegerRuta, admin)

router.get('/propiedades/crear', protegerRuta, crear)
router.post('/propiedades/crear', protegerRuta,
    body('titulo').notEmpty().withMessage('El Titulo del Anuncio es Obligatorio'),
    body('descripcion')
        .notEmpty().withMessage('La Descripcion no puede ir vacia')
        .isLength({max: 200 }).withMessage('La Descripcion es muy larga'),
    body('categoria').isNumeric().withMessage('Selecciona una Categoria'),
    body('precio').isNumeric().withMessage('Selecciona un Precio'),
    body('habitaciones').isNumeric().withMessage('Selecciona un numero de Habitaciones'),
    body('estacionamiento').isNumeric().withMessage('Selecciona un numero de Estacionamientos'),
    body('wc').isNumeric().withMessage('Selecciona un numero de wc'),
    body('lat').notEmpty().withMessage('Ubica la propiedad en el mapa'),
    guardar
)

router.get('/propiedades/agregar-imagen/:id', protegerRuta, agregarImagen)
router.post('/propiedades/agregar-imagen/:id',
    protegerRuta,
    upload.single('imagen'),
    almacenarImagen
)

router.get('/propiedades/editar/:id', protegerRuta, editar)
router.post('/propiedades/editar/:id', protegerRuta,
    body('titulo').notEmpty().withMessage('El Titulo del Anuncio es Obligatorio'),
    body('descripcion')
        .notEmpty().withMessage('La Descripcion no puede ir vacia')
        .isLength({max: 200 }).withMessage('La Descripcion es muy larga'),
    body('categoria').isNumeric().withMessage('Selecciona una Categoria'),
    body('precio').isNumeric().withMessage('Selecciona un Precio'),
    body('habitaciones').isNumeric().withMessage('Selecciona un numero de Habitaciones'),
    body('estacionamiento').isNumeric().withMessage('Selecciona un numero de Estacionamientos'),
    body('wc').isNumeric().withMessage('Selecciona un numero de wc'),
    body('lat').notEmpty().withMessage('Ubica la propiedad en el mapa'),
    guardarCambios
)

router.post('/propiedades/eliminar/:id', protegerRuta, eliminar)

router.put('/propiedades/:id', protegerRuta, cambiarEstado)

//Area publica

router.get('/propiedad/:id', identificarUsuario, mostarPropiedad)

//Almacenar Mensaje
router.post('/propiedad/:id', 
    identificarUsuario, 
    body('mensaje').isLength({min: 10}).withMessage('No puede ir vacio o es muy corto'),
    enviarMensaje
)

//Leer mensaje
router.get('/mensajes/:id',
    protegerRuta,
    verMensaje
)


export default router