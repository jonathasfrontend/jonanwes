const express = require('express');
const fileUpload = require('express-fileupload');
var bodyParser = require('body-parser')
var Posts = require('./Posts.js');
var session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();

mongoose.connect('mongodb+srv://root:dFrPbwloK4qEAnKy@cluster0.xvdlp.mongodb.net/jonanews?retryWrites=true&w=majority',{useNewUrlParser: true, useUnifiedTopology: true}).then(function(){
    console.log('Banco de dados conectado com sucesso');
}).catch(function(err){
    console.log(err.message)
});

app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : path.join(__dirname, 'temp')
}));

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.use(session({ secret: '8j5y98jhnbujnbljbunfsjnrt9uhnitjgjgnb', cookie: { maxAge: 60000 }}))

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/pages'));


app.get('/',(req,res)=>{
    if(req.query.busca == null){

        Posts.find({}).sort({'_id': -1}).exec(function(err,posts){
            posts = posts.map(function(val){
                return{
                    titulo: val.titulo,
                    imagem: val.imagem,
                    descricaoCurta: val.conteudo.substr(0,100),
                    categoria: val.categoria,
                    conteudo: val.conteudo,
                    slug: val.slug
                }
            })

        Posts.find({}).sort({'vews': 1}).limit(6).exec(function(err,postsTop){
                postsTop = postsTop.map(function(val){
                        return {
                            titulo: val.titulo,
                            conteudo: val.conteudo,
                            descricaoCurta: val.conteudo.substr(0,100),
                            imagem: val.imagem,
                            slug: val.slug,
                            categoria: val.categoria,
                            vews: val.vews
                        }
                })
                res.render('home',{posts:posts,postsTop:postsTop});
            })

        })

    }else{

        Posts.find({titulo: {$regex: req.query.busca, $options: 'i'}},function(err,posts){
            posts = posts.map(function(val){
                return {
                    titulo: val.titulo,
                    conteudo: val.conteudo,
                    descricaoCurta: val.conteudo.substr(0,100),
                    imagem: val.imagem,
                    slug: val.slug,
                    categoria: val.categoria,
                    vews: val.vews
                }
        })
            res.render('busca',{posts:posts,contagem:posts.length});
        })

    }
  
});


app.get('/:slug',(req,res)=>{
    Posts.findOneAndUpdate({slug: req.params.slug},{$inc: {vews: 1}},{new: true},function(err,resposta){
        if(resposta != null){
            Posts.find({}).sort({'vews': 1}).limit(4).exec(function(err,postsTop){
                postsTop = postsTop.map(function(val){
                        return {
                            titulo: val.titulo,
                            conteudo: val.conteudo,
                            descricaoCurta: val.conteudo.substr(0,100),
                            imagem: val.imagem,
                            slug: val.slug,
                            categoria: val.categoria,
                            vews: val.vews
                        }
                })
                res.render('single',{noticia:resposta,postsTop:postsTop});
            })
        }else{
            res.send(`
                <h1>404</h1>
                <h2>Not Found</h2>

            `);
        }
    })
})

var usuarios = [
    {
        nome: 'jonathass5678@gmail.com',
        senha: '2018229332520213028730'
    }
]

app.post('/admin/login',(req,res)=>{
    usuarios.map(function(val){
        if(val.nome == req.body.login && val.senha == req.body.senha){
            req.session.login = 'Jonathas'
        }
    })
    res.redirect('/admin/login')
})

app.get('/admin/login',(req,res)=>{

    if(req.session.login == null){
        res.render('admin-login');
    }else{
        Posts.find({}).sort({'_id': -1}).exec(function(err,posts){
            posts = posts.map(function(val){
                    return {
                        id: val._id,
                        titulo: val.titulo,
                        conteudo: val.conteudo,
                        descricaoCurta: val.conteudo.substr(0,100),
                        imagem: val.imagem,
                        slug: val.slug,
                        categoria: val.categoria
                    }
            })
            res.render('admin-painel',{posts:posts});
        })
    }
});

app.post('/admin/cadastro',(req,res)=>{

let formato = req.files.arquivo.name.split('.');
let formato2 = req.files.arquivocapa.name.split('.');
var imagem = "";
var imagemcapa = ""

if(formato[formato.length - 1] == 'jpg'){
    imagem = new Date().getTime()+'.jpg';
    req.files.arquivo.mv(__dirname+'/public/images/upload/'+imagem);
}else{
    fs.unlinkSync(req.files.arquivo.tempFilePath);
}

if(formato2[formato2.length - 1] == 'jpg'){
    imagemcapa = new Date().getTime()+'.jpg';
    req.files.arquivocapa.mv(__dirname+'/public/images/capa/'+imagemcapa);
}else{
    fs.unlinkSync(req.files.arquivocapa.tempFilePath);
}

    Posts.create({
    titulo: req.body.titulo_noticia,
    imagem: 'http://jonanews.herokuapp.com/public/images/upload/'+imagem,
    categoria: req.body.categoria,
    conteudo: req.body.noticia,
    slug: req.body.slug,
    author: req.body.autor,
    vews: 0,
    imagemCapa:'http://jonanews.herokuapp.com/public/images/capa/'+imagemcapa,
})
res.redirect('/admin/login');
})

app.get('/admin/deletar/:id',(req,res)=>{
    Posts.deleteOne({_id:req.params.id}).then(function(){
        res.redirect('/admin/login');
    })
})

app.listen(process.env.PORT || 3000,()=>{
    console.log('server rodando!');
})