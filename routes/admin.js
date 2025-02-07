import express from 'express'
const router = express.Router()
import mongoose from 'mongoose'
import Categorias from '../models/Categoria.js'
const Categoria = mongoose.model('categorias')
import postagem from '../models/Postagem.js'
const Postagem = mongoose.model('postagens') 
import {eAdmin} from '../helpers/eAdmin.js'

router.get('/', (req,res)=>{
    res.render("admin/index")
})

router.get('/posts',eAdmin, (req,res)=>{
    res.send('Página de posts')
})

router.get('/categorias', eAdmin, async (req, res) => {
    try {
        const categorias = await Categoria.find().sort({date:'desc'}).lean();
        res.render('admin/categorias', { categorias });
    } catch (err) {
        req.flash('error_msg', 'Houve um erro ao listar as categorias');
        res.redirect('/admin');
    }
});

router.get("/categorias/edit/:id", eAdmin, (req,res) => {
   Categoria.findOne({_id:req.params.id}).then((categoria)=> {
    res.render('admin/editcategorias', {nome: categoria.nome, slug: categoria.slug, id:categoria.id})
   }).catch((err) => {
        req.flash("error_msg", 'Esta categoria nao existe')
        res.redirect('/admin/categorias')
   })
   
})

router.post('/categorias/deletar', eAdmin, (req, res) => {
    console.log(req.body.id)
    Categoria.deleteOne({_id: req.body.id}).then(() => {
        req.flash('success_msg', 'Categoria deletada com sucesso!');
        res.redirect('/admin/categorias');
    }).catch((err) => {
        req.flash('error_msg', 'Erro ao deletar a categoria!');
        res.redirect('/admin/categorias');
    });
});



router.post('/categorias/edit', eAdmin, (req,res)=> {
    Categoria.findOne({_id: req.body.id}).then( categoria => {

        categoria.nome = req.body.nome
        categoria.slug = req.body.slug

        categoria.save().then(() => {
            req.flash('success_msg', 'Categoria editada com Sucesso!')
            res.redirect('/admin/categorias')
        }).catch( err => { // ERR: Erro ao salvar::editar
            req.flash('error_msg', 'Houve um erro interno ao editar categoria.')
            res.redirect("/admin/categorias")
        })

    }).catch( err => { // ERR: Não encontrou a categoria
        req.flash('error_msg', 'Houve um erro ao editar categoria.') //Mensagem de Erro
        res.redirect("/admin/categorias")
    })
})
router.get("/postagens", eAdmin, (req,res)=> {
    Postagem.find().lean().populate("categoria").sort({data:"desc"}).then((postagens)=>{
        res.render("admin/postagens", {postagens:postagens})
    }).catch((err)=>{
        req.flash("error_msg", "Houve um erro ao listar as postagens")
        console.log(err)
        res.redirect("/admin")
    })
    
})

router.get('/postagens/edit/:id',eAdmin, (req,res) => {
    Postagem.findOne({_id: req.params.id}).lean().then((postagem)=>{
        Categoria.find().lean().then((categorias)=>{
            res.render("admin/editpostagens", {categorias:categorias, postagem:postagem})            
        }).catch((err)=>{
            req.flash('error_msg', "Houve um erro ao listar as categorias")
            res.redirect('/admin/postagens')
        })
    }).catch((err)=>{
        req.flash("error_msg", "Houve um erro ao carregar o formulário de edição")
        res.redirect('/admin/postagens')
    })
    
})
router.post('/postagem/edit', eAdmin, (req,res)=>{
    Postagem.findOne({_id: req.body.id}).then((postagem)=>{
        postagem.titulo = req.body.titulo
        postagem.slug = req.body.slug
        postagem.descricao = req.body.descricao
        postagem.conteudo = req.body.conteudo
        postagem.categoria = req.body.categoria

        postagem.save().then(()=>{
            req.flash('success_msg', "Postagem editada com sucesso!")
            res.redirect('/admin/postagens')
        }).catch((err)=>{
            req.flash("error_msg", "Erro ao editar a categoria")
            console.error(err)
            res.redirect('/admin/postagens')
        })
    }).catch((err)=>{
        console.error(err)
        req.flash("error_msg", "Houve um erro ao salvar a edição")
        res.redirect('/admin/postagens')
    })
})

router.get('/postagens/deletar/:id', eAdmin, (req,res)=>{
    Postagem.deleteOne({_id:req.params.id}).then(()=>{
        req.flash('success_msg', 'Postagem deletada com sucesso')
        res.redirect('/admin/postagens')
    }).catch((err)=>{
        req.flash('error_msg', "Houve um erro interno")
        res.redirect('/admin/postagens')
    })
})

router.get("/postagens/add", eAdmin, (req, res) => {
    Categoria.find().lean().then((categorias) => {
      res.render("admin/addpostagem", {categorias: categorias})
    }).catch((err) => {
       req.flash("error.msg", "Houve um erro ao carregar o formulário!")
       res.redirect("/admin")
    })
 });



router.get('/categorias/add', eAdmin, (req,res) =>{
    res.render('admin/addcategorias')
})

router.post('/postagens/nova', eAdmin, (req,res)=>{
    let erros = []

    if(req.body.categoria == "0"){
        erros.push({texto: "Categoria inválida, registre uma categoria"})
    }
    if(erros.length > 0){
        res.render("admin/addpostagem", {erros: erros})
    }else{
        const novaPostagem = {
            titulo: req.body.titulo,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria,
            slug: req.body.slug
        }

        new Postagem(novaPostagem).save().then(()=>{
            req.flash("success_msg", `Postagem ${req.body.titulo} criada com sucesso`)
            res.redirect("/admin/postagens")
        }).catch((err)=>{
            req.flash("error_msg", "Houve um erro durante o salvamento da postagem")
            res.redirect("/admin/postagens")
        })
    }
})

router.post('/categorias/nova', eAdmin, (req,res)=>{
    
    var erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || typeof req.body.nome == null){
            erros.push({texto: 'Nome inválido'})
    }
    if(!req.body.slug || typeof req.body.slug == undefined || typeof req.body.slug == null){
        erros.push({texto:'Slug inválido'})
    }

    if(req.body.nome.length < 2 && (req.body.nome || typeof req.body.nome != undefined || typeof req.body.nome != null )){
        erros.push({texto: 'Nome da categoria é muito pequeno'})
    }

    if(erros.length > 0){
        res.render("admin/addcategorias", {erros: erros})
    }else{
        const novaCategoria = {
            nome: req.body.nome,
            slug: req.body.slug
        }
    
        new Categoria(novaCategoria).save().then(()=> {
            req.flash("success_msg", "Categoria criada com sucesso")
            res.redirect('/admin/categorias')
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao salvar a categoria, tente novamente")
            res.redirect('/admin')
        })
    }

    

    
})
export default router