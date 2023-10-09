import express from 'express'
import {propiedades} from '../Crontrollers/apiController.js'
const router = express.Router()

router.get('/propiedades', propiedades)

export default router


