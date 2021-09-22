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
      Route.get('/verify-token', 'AuthController.verify').middleware('auth:userApi')
    }).prefix('/user')

    Route.group(() => {
      Route.get('/get-token', 'AuthController.adminLogin')
    }).prefix('/admin')

    Route.delete('/logout', 'AuthController.logout').middleware('auth:userApi,adminApi')
  }).prefix('/auth')

  Route.group(() => {
    Route.get('/:id/detail', 'ContentsController.fullContent')
      .where('id', {
        match: /^[0-9]+$/,
        cast: (id) => Number(id),
      })
      .middleware('auth:userApi,adminApi')
    Route.get('/:id', 'ContentsController.rawContent')
      .where('id', {
        match: /^[0-9]+$/,
        cast: (id) => Number(id),
      })
      .middleware('auth:userApi,adminApi')
    Route.put('/:id', 'ContentsController.editContent')
      .where('id', {
        match: /^[0-9]+$/,
        cast: (id) => Number(id),
      })
      .middleware(['auth:adminApi', 'adminRole:super'])
    Route.delete('/:id', 'ContentsController.delete')
      .where('id', {
        match: /^[0-9]+$/,
        cast: (id) => Number(id),
      })
      .middleware(['auth:adminApi', 'adminRole:super'])
    Route.post('/:id/like', 'ContentsController.like')
      .where('id', {
        match: /^[0-9]+$/,
        cast: (id) => Number(id),
      })
      .middleware('auth:userApi')
    Route.post('/:id/unlike', 'ContentsController.unlike')
      .where('id', {
        match: /^[0-9]+$/,
        cast: (id) => Number(id),
      })
      .middleware('auth:userApi')
    Route.post('/:id', 'ContentsController.addBab')
      .where('id', {
        match: /^[0-9]+$/,
        cast: (id) => Number(id),
      })
      .middleware(['auth:adminApi', 'adminRole:super'])
    Route.post('/', 'ContentsController.addContent').middleware([
      'auth:adminApi',
      'adminRole:super',
    ])
    Route.get('/', 'ContentsController.index').middleware('auth:userApi,adminApi')
  }).prefix('/content')

  Route.group(() => {
    Route.get('/:id/read', 'BabsController.read').middleware(['auth:userApi'])
    Route.delete('/:id', 'BabsController.delete')
      .where('id', {
        match: /^[0-9]+$/,
        cast: (id) => Number(id),
      })
      .middleware(['auth:adminApi', 'adminRole:super'])
    Route.put('/:id', 'BabsController.edit')
      .where('id', {
        match: /^[0-9]+$/,
        cast: (id) => Number(id),
      })
      .middleware(['auth:adminApi', 'adminRole:super'])
    Route.get('/:id', 'BabsController.get')
      .where('id', {
        match: /^[0-9]+$/,
        cast: (id) => Number(id),
      })
      .middleware(['auth:adminApi', 'adminRole:super'])
  }).prefix('/bab')

  Route.group(() => {
    Route.get('/', 'CategoriesController.index')
  }).prefix('/categories')

  Route.group(() => {
    Route.get('/', 'AuthorsController.index')
  }).prefix('/authors')

  Route.group(() => {
    Route.get('/cover/:filename', 'StreamsController.streamCover')
    Route.get('/synopsis/:filename', 'StreamsController.streamSynopsis')
    Route.get('/bab/:filename', 'StreamsController.streamBab').as('streamBab')
  }).prefix('/stream')

  Route.group(() => {
    Route.post('/', 'CoursesController.create').middleware(['auth:adminApi', 'adminRole:super'])
  }).prefix('/course')

  Route.group(() => {
    Route.delete('/:id', 'PartnersController.delete').where('id', {
      match: /^[0-9]+$/,
      cast: (id) => Number(id),
    })
    Route.put('/:id', 'PartnersController.edit').where('id', {
      match: /^[0-9]+$/,
      cast: (id) => Number(id),
    })
    Route.get('/', 'PartnersController.index')
    Route.post('/', 'PartnersController.create')
  })
    .prefix('/partner')
    .middleware(['auth:adminApi', 'adminRole:super'])

  Route.group(() => {
    Route.get('/daily-user-login', 'StatsController.userLogin')
    Route.get('/most-read-book', 'StatsController.mostReadBook')
    Route.get('/most-read-category', 'StatsController.mostReadCategory')
    Route.get('/monthly-active-user', 'StatsController.mostActiveUser')
    Route.get('/user-reading-log/:id', 'StatsController.userReads').where('id', {
      match: /^[0-9]+$/,
      cast: (id) => Number(id),
    })
  })
    .prefix('/stat')
    .middleware(['auth:adminApi', 'adminRole:super,partner'])

  Route.group(() => {
    Route.post('/MTFhZ3VzdHVz', 'HooksController.updateUser')
  }).prefix('/hook')
}).prefix('/api')
