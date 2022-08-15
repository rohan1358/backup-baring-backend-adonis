"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
Route_1.default.group(() => {
    Route_1.default.group(() => {
        Route_1.default.group(() => {
            Route_1.default.get('/get-token', 'AuthController.login');
            Route_1.default.post('/register', 'AuthController.register');
            Route_1.default.get('/verify-token', 'AuthController.verify').middleware('auth:userApi');
            Route_1.default.post('/reset-request', 'AuthController.requestResetPass');
            Route_1.default.post('/reset-password', 'AuthController.resetPass');
        }).prefix('/user');
        Route_1.default.group(() => {
            Route_1.default.get('/get-token', 'AuthController.adminLogin');
        }).prefix('/admin');
        Route_1.default.delete('/logout', 'AuthController.logout').middleware('auth:userApi,adminApi');
    }).prefix('/auth');
    Route_1.default.group(() => {
        Route_1.default.get('/:id/detail', 'ContentsController.fullContent')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware('auth:userApi,adminApi');
        Route_1.default.get('/:id', 'ContentsController.rawContent')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware('auth:userApi,adminApi');
        Route_1.default.put('/:id', 'ContentsController.editContent')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware(['auth:adminApi', 'adminRole:super']);
        Route_1.default.delete('/:id', 'ContentsController.delete')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware(['auth:adminApi', 'adminRole:super']);
        Route_1.default.post('/:id/like', 'ContentsController.like')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware('auth:userApi');
        Route_1.default.post('/:id/unlike', 'ContentsController.unlike')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware('auth:userApi');
        Route_1.default.post('/:id', 'ContentsController.addBab')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware(['auth:adminApi', 'adminRole:super']);
        Route_1.default.post('/', 'ContentsController.addContent').middleware([
            'auth:adminApi',
            'adminRole:super',
        ]);
        Route_1.default.get('/', 'ContentsController.index').middleware('auth:userApi,adminApi');
    }).prefix('/content');
    Route_1.default.group(() => {
        Route_1.default.get('/:id/read', 'BabsController.read').middleware(['auth:userApi']);
        Route_1.default.delete('/:id', 'BabsController.delete')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware(['auth:adminApi', 'adminRole:super']);
        Route_1.default.put('/:id', 'BabsController.edit')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware(['auth:adminApi', 'adminRole:super']);
        Route_1.default.get('/:id', 'BabsController.get')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware(['auth:adminApi', 'adminRole:super']);
    }).prefix('/bab');
    Route_1.default.group(() => {
        Route_1.default.get('/content', 'CategoriesController.contentGroupByCategory').middleware('auth:userApi,adminApi');
        Route_1.default.put('/:id', 'CategoriesController.addIcon').middleware('auth:adminApi');
        Route_1.default.get('/:id', 'CategoriesController.read').middleware('auth:userApi,adminApi');
        Route_1.default.get('/', 'CategoriesController.index');
    }).prefix('/category');
    Route_1.default.group(() => {
        Route_1.default.get('/', 'AuthorsController.index');
    }).prefix('/authors');
    Route_1.default.group(() => {
        Route_1.default.get('/cover/:filename', 'StreamsController.streamCover');
        Route_1.default.get('/icon/:filename', 'StreamsController.streamIcon');
        Route_1.default.get('/partner-logo/:id', 'StreamsController.partnerLogo');
        Route_1.default.get('/course-cover/:filename', 'StreamsController.streamCourseCover');
        Route_1.default.get('/user-avatar/:filename', 'StreamsController.streamUserAvatar');
        Route_1.default.get('/course-pdf/:filename', 'StreamsController.streamCoursePDF');
        Route_1.default.get('/course-audio/:filename', 'StreamsController.streamSubjectAudio').as('streamSubjectAudio');
        Route_1.default.get('/subject-pdf/:filename', 'StreamsController.streamSubjectPDF').as('streamSubjectPDF');
        Route_1.default.get('/product-cover/:filename', 'StreamsController.streamProductCover');
        Route_1.default.get('/synopsis/:filename', 'StreamsController.streamSynopsis');
        Route_1.default.get('/bab/:filename', 'StreamsController.streamBab').as('streamBab');
    }).prefix('/stream');
    Route_1.default.group(() => {
        Route_1.default.get('/list', 'CoursesController.list').middleware('auth:userApi');
        Route_1.default.post('/join/:id', 'CoursesController.join')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware('auth:userApi');
        Route_1.default.post('/:id/mentor', 'CoursesController.addMentor')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware(['auth:adminApi', 'adminRole:super']);
        Route_1.default.delete('/:id/mentor/:userId', 'CoursesController.deleteMentor')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .where('userId', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware(['auth:adminApi', 'adminRole:super']);
        Route_1.default.put('/:id/pdf', 'CoursesController.changePDF')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware(['auth:adminApi', 'adminRole:super']);
        Route_1.default.put('/:id/cover', 'CoursesController.changeCover')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware(['auth:adminApi', 'adminRole:super']);
        Route_1.default.delete('/:id', 'CoursesController.delete')
            .middleware(['auth:adminApi', 'adminRole:super'])
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
        Route_1.default.post('/:id', 'SubjectsController.createWithoutParent')
            .middleware(['auth:adminApi', 'adminRole:super'])
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
        Route_1.default.get('/:id', 'CoursesController.read')
            .middleware('auth:userApi,adminApi')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
        Route_1.default.get('/', 'CoursesController.index').middleware('auth:userApi,adminApi');
    }).prefix('/course');
    Route_1.default.group(() => {
        Route_1.default.delete('/:id', 'PartnersController.delete').where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
        Route_1.default.put('/:id/logo', 'PartnersController.changeLogo').where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
        Route_1.default.put('/:id', 'PartnersController.edit').where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
        Route_1.default.get('/', 'PartnersController.index');
        Route_1.default.post('/', 'PartnersController.create');
    })
        .prefix('/partner')
        .middleware(['auth:adminApi', 'adminRole:super']);
    Route_1.default.group(() => {
        Route_1.default.get('/book-was-read/:id', 'StatsController.bookWasRead').where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
        Route_1.default.get('/user-access/:id', 'StatsController.userAccess').where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
        Route_1.default.get('/daily-user-login', 'StatsController.userLogin');
        Route_1.default.get('/most-read-book', 'StatsController.mostReadBook');
        Route_1.default.get('/most-read-category', 'StatsController.mostReadCategory');
        Route_1.default.get('/monthly-active-user', 'StatsController.mostActiveUser');
        Route_1.default.get('/user-reading-log/:id', 'StatsController.userReads').where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
    })
        .prefix('/stat')
        .middleware(['auth:adminApi', 'adminRole:super,partner']);
    Route_1.default.group(() => {
        Route_1.default.post('/c2F5YSBpbmdpbiBrYXlh', 'HooksController.afterPaid');
        Route_1.default.post('/MTFhZ3VzdHVz', 'HooksController.updateUser');
        Route_1.default.get('/YWtiYXJhZGl0YW1h', 'HooksController.productHook');
    }).prefix('/hook');
    Route_1.default.group(() => {
        Route_1.default.put('/token', 'UsersController.setFcm').middleware('auth:userApi');
        Route_1.default.put('/change-profile', 'UsersController.editProfile').middleware('auth:userApi');
        Route_1.default.get('/:id', 'UsersController.read');
        Route_1.default.get('/', 'UsersController.index').middleware('auth:adminApi,userApi');
    }).prefix('/user');
    Route_1.default.group(() => {
        Route_1.default.put('/arrange', 'SubjectsController.arrange').middleware([
            'auth:adminApi',
            'adminRole:super',
        ]);
        Route_1.default.post('/:id', 'SubjectsController.createInParent')
            .middleware(['auth:adminApi', 'adminRole:super'])
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
        Route_1.default.put('/:id', 'SubjectsController.edit')
            .middleware(['auth:adminApi', 'adminRole:super'])
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
        Route_1.default.delete('/:id', 'SubjectsController.delete')
            .middleware(['auth:adminApi', 'adminRole:super'])
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
        Route_1.default.get('/:id', 'SubjectsController.read')
            .middleware('auth:adminApi,userApi')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
    }).prefix('/subject');
    Route_1.default.group(() => {
        Route_1.default.get('/reply/:id', 'CommentsController.readReplies')
            .middleware('auth:userApi')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
        Route_1.default.post('/reply/:id', 'CommentsController.reply')
            .middleware('auth:userApi')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
        Route_1.default.post('/:id', 'CommentsController.create')
            .middleware('auth:userApi')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
        Route_1.default.get('/:id', 'CommentsController.index')
            .middleware('auth:userApi')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
    }).prefix('/comment');
    Route_1.default.group(() => {
        Route_1.default.post('/:id', 'BoostsController.create')
            .middleware('auth:userApi')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
        Route_1.default.get('/:id', 'BoostsController.index')
            .middleware('auth:userApi')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
    }).prefix('/boost');
    Route_1.default.group(() => {
        Route_1.default.post('/:id', 'ReviewsController.create')
            .middleware('auth:userApi')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
        Route_1.default.get('/:id', 'ReviewsController.index')
            .middleware('auth:userApi')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        });
    }).prefix('/review');
    Route_1.default.group(() => {
        Route_1.default.put('/:id/cover', 'ProductsController.changeCover')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware(['auth:adminApi', 'adminRole:super']);
        Route_1.default.put('/:id/weight', 'ProductsController.changeWeight')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware(['auth:adminApi', 'adminRole:super']);
        Route_1.default.get('/:id', 'ProductsController.read')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware('auth:userApi,adminApi');
        Route_1.default.delete('/:id', 'ProductsController.delete')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware(['auth:adminApi', 'adminRole:super']);
        Route_1.default.get('/', 'ProductsController.index').middleware('auth:userApi,adminApi');
    }).prefix('/product');
    Route_1.default.group(() => {
        Route_1.default.post('/increase', 'CartsController.increase');
        Route_1.default.post('/decrease', 'CartsController.decrease');
        Route_1.default.post('/reset', 'CartsController.reset');
        Route_1.default.get('/', 'CartsController.index');
    })
        .prefix('/cart')
        .middleware('auth:userApi');
    Route_1.default.group(() => {
        Route_1.default.get('/province', 'RajaongkirsController.getProvince');
        Route_1.default.get('/city', 'RajaongkirsController.getCity');
        Route_1.default.get('/subdistrict', 'RajaongkirsController.getSubdistrict');
        Route_1.default.get('/cost', 'RajaongkirsController.cost');
    })
        .prefix('/shipping')
        .middleware(['auth:userApi,adminApi', 'adminRole:super']);
    Route_1.default.group(() => {
        Route_1.default.put('/resi/:id', 'CheckoutsController.insertResi').middleware([
            'auth:adminApi',
            'adminRole:super',
        ]);
        Route_1.default.put('/status/:id', 'CheckoutsController.changeStatus').middleware([
            'auth:adminApi',
            'adminRole:super',
        ]);
        Route_1.default.get('/get-print', 'CheckoutsController.requestPrint').middleware([
            'auth:adminApi',
            'adminRole:super',
        ]);
        Route_1.default.get('/print', 'CheckoutsController.print').as('print');
        Route_1.default.get('/list', 'CheckoutsController.list').middleware('auth:userApi');
        Route_1.default.get('/:id', 'CheckoutsController.read').middleware([
            'auth:userApi,adminApi',
            'adminRole:super',
        ]);
        Route_1.default.post('/', 'CheckoutsController.create').middleware('auth:userApi');
        Route_1.default.get('/', 'CheckoutsController.index').middleware(['auth:adminApi', 'adminRole:super']);
    }).prefix('/checkout');
    Route_1.default.group(() => {
        Route_1.default.delete('/:id', 'BanksController.delete').middleware(['auth:adminApi', 'adminRole:super']);
        Route_1.default.put('/:id', 'BanksController.edit').middleware(['auth:adminApi', 'adminRole:super']);
        Route_1.default.post('/', 'BanksController.create').middleware(['auth:adminApi', 'adminRole:super']);
        Route_1.default.get('/', 'BanksController.index');
    }).prefix('bank');
    Route_1.default.group(() => {
        Route_1.default.get('/rajaongkir', 'ConfigsController.getRajaongkir');
        Route_1.default.post('/rajaongkir', 'ConfigsController.setRajaongkir').middleware([
            'auth:adminApi',
            'adminRole:super',
        ]);
        Route_1.default.get('/', 'ConfigsController.getConfig');
        Route_1.default.post('/', 'ConfigsController.setConfig').middleware(['auth:adminApi', 'adminRole:super']);
    }).prefix('config');
    Route_1.default.group(() => {
        Route_1.default.get('/package', 'SubscriptionsController.packageList');
        Route_1.default.post('/:id', 'SubscriptionsController.create')
            .where('id', {
            match: /^[0-9]+$/,
            cast: (id) => Number(id),
        })
            .middleware('auth:userApi');
    })
        .prefix('/subscription')
        .middleware('auth:userApi');
    Route_1.default.group(() => {
        Route_1.default.delete('/:id', 'ClipsController.delete');
        Route_1.default.post('/', 'ClipsController.create');
        Route_1.default.get('/', 'ClipsController.index');
    })
        .prefix('/clip')
        .middleware('auth:userApi');
}).prefix('/api');
//# sourceMappingURL=routes.js.map