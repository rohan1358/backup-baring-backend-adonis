/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.group(() => {
    Route.group(() => {
      Route.get('/get-token', 'AuthController.login')
      Route.post('/register', 'AuthController.register')
    }).prefix('/user')

    Route.group(() => {
      Route.get('/get-token', 'AuthController.adminLogin')
    }).prefix('/admin')

    Route.delete('/logout', 'AuthController.logout').middleware('auth:userApi,adminApi')
  }).prefix('/auth')

  Route.group(() => {
    Route.get('/:id/detail', 'ContentsController.fullContent').where('id', {
      match: /^[0-9]+$/,
      cast: (id) => Number(id),
    })
    Route.get('/:id', 'ContentsController.rawContent').where('id', {
      match: /^[0-9]+$/,
      cast: (id) => Number(id),
    })
    Route.put('/:id', 'ContentsController.editContent')
      .where('id', {
        match: /^[0-9]+$/,
        cast: (id) => Number(id),
      })
      .middleware('auth:adminApi')
    Route.delete('/:id', 'ContentsController.delete')
      .where('id', {
        match: /^[0-9]+$/,
        cast: (id) => Number(id),
      })
      .middleware('auth:adminApi')
    Route.post('/:id', 'ContentsController.addBab')
      .where('id', {
        match: /^[0-9]+$/,
        cast: (id) => Number(id),
      })
      .middleware('auth:adminApi')
    Route.post('/', 'ContentsController.addContent').middleware('auth:adminApi')
    Route.get('/', 'ContentsController.index')
  }).prefix('/content')

  Route.group(() => {
    Route.get('/:id/read', 'BabsController.read').middleware(['auth:userApi'])
    Route.get('/:id/stream', 'BabsController.audioStream')
    Route.delete('/:id', 'BabsController.delete')
      .where('id', {
        match: /^[0-9]+$/,
        cast: (id) => Number(id),
      })
      .middleware('auth:adminApi')
    Route.put('/:id', 'BabsController.edit')
      .where('id', {
        match: /^[0-9]+$/,
        cast: (id) => Number(id),
      })
      .middleware('auth:adminApi')
    Route.get('/:id', 'BabsController.get')
      .where('id', {
        match: /^[0-9]+$/,
        cast: (id) => Number(id),
      })
      .middleware('auth:adminApi')
  }).prefix('/bab')
}).prefix('/api')
