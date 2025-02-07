//Carregando módulos
    import { fileURLToPath } from 'url';
    import { dirname } from 'path';
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    import express from 'express'
    const app = express()
    import { engine } from 'express-handlebars'
    import mongoose from 'mongoose'
    import admin from './routes/admin.js'
    import path from "path"
    import session from 'express-session';
    import flash from 'connect-flash';
    import postagem from './models/Postagem.js';
    const Postagem = mongoose.model('postagens') 
    const Categoria = mongoose.model('categorias')
    import usuarios from './routes/usuario.js'
    import passport from 'passport';
    import auth from './config/auth.js'
    auth(passport)
    
    

//Configurações
    //Sessão
        app.use(session({
            secret: "cursodenode",
            resave:true,
            saveUninitialized:true
        }))
        app.use(passport.initialize())
        app.use(passport.session())
         
        app.use(flash())
    //Middleware
        app.use((req,res,next)=>{
            res.locals.success_msg = req.flash("success_msg")
            res.locals.error_msg = req.flash('error_msg')
            res.locals.error = req.flash('error')
            res.locals.user = req.user || null
            next()
        })
    // Body Parser
        app.use(express.urlencoded({extended: true}));
        app.use(express.json());
    //HandleBars
        app.engine('handlebars', engine());
        app.set('view engine', 'handlebars');
        app.set('views', './views');
    //Mongoose
        mongoose.Promise = global.Promise;
        mongoose.connect('mongodb://localhost:27017/blogapp', {
        }).then(() => {
            console.log("Conectado ao banco de dados mongodb")
        }).catch((err) => {
            console.log("Erro ao se conectar ao mongodb: ", err)
        })
    // Public
        app.use(express.static(path.join(__dirname,"public")))
        
//Rotas
    app.get('/', (req,res)=>{
        Postagem.find().lean().populate("categoria").sort({data: "desc"}).then((postagens) => {
            res.render('index',{postagens:postagens})
        }).catch((err)=>{
            req.flash("error_msg", "Houve um erro interno")
            res.redirect("/404")
        })
        
    })

    app.get('/404', (req,res)=>{
        res.send('Error 404')
    })

    app.get('/postagem/:id', (req, res)=>{
        Postagem.findOne({_id: req.params.id}).lean().then((postagem)=>{
            if(postagem){
                res.render('postagem/index', {postagem:postagem})
            }else{
                req.flash('error_msg', "Essa postagem não existe")
                res.redirect('/')
            }
        }).catch((err) => {
            req.flash('error_msg','Houve um erro interno')
            res.redirect('/')
        })
    })
    app.get('/categorias', (req,res)=>{
        Categoria.find().lean().then((categorias)=>{
            res.render('categorias/index', {categorias: categorias})
        }).catch((err)=>{
            req.flash("error_msg", "Houve um erro interno ao listar as categorias")
            res.redirect('/')
        })
    })
    app.get('/categorias/:id', (req,res)=>{
        Categoria.findOne({_id: req.params.id}).lean().then((categoria)=>{
            if(categoria){
                Postagem.find({categoria: categoria._id}).lean().then((postagens)=>{
                    res.render("categorias/postagens", {postagens:postagens, categoria:categoria})
                }).catch((err)=>{
                    req.flash("error_msg", "Houve um erro ao listar os posts")
                    res.redirect('/')
                })
            }else{
                req.flash('error_msg', "Essa categoria não existe")
                res.redirect('/')
            }
        }).catch((err) => {
            req.flash('error_msg','Houve um erro interno')
            res.redirect('/')
        })
    })
    app.use('/admin', admin)
    app.use('/usuarios', usuarios)
//Outros
const PORT = 8081
app.listen(PORT, ()=>{
    console.log("Server running on port " + PORT)
})