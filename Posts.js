var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
    titulo: String,
    imagem: String,
    categoria: String,
    conteudo: String,
    slug: String,
    author: String,
    vews: Number,
    imagemCapa: String,
},{collection:'posts'})

var Posts = mongoose.model("Posts",postSchema);

module.exports = Posts;