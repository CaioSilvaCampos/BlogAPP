import passport from "passport"
import { Strategy as LocalStrategy } from "passport-local";
import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import Usuarios from '../models/Usuario.js'
const Usuario = mongoose.model("usuarios")


const Passport = function(passport){
    passport.use(new LocalStrategy({
        usernameField:'email',
        passwordField:'senha'
    },(email,senha,done)=>{
        Usuario.findOne({email:email}).lean().then((usuario)=>{
            if(!usuario){
                return done (null, false,{message:"Esta conta não existe"})
            }
            bcrypt.compare(senha, usuario.senha, (erro,batem)=>{
                if(batem){
                    return done(null, usuario)
                }else{
                    return done(null,false,{message: "Senha incorreta"})
                }
            })
        })
    }))

    passport.serializeUser((usuario,done)=>{
        done(null, usuario)
        console.log('logado')
    })

    passport.deserializeUser((id, done) => {
        Usuario.findById(id)
            .then(usuario => {
                if (!usuario) {
                    return done(null, false);
                }
                done(null, usuario);
            })
            .catch(err => {
                done(err, null);
            });
    });
}

export default Passport