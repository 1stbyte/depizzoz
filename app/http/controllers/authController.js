const bcrypt = require('bcrypt')
const User = require('../../models/user')
const passport = require('passport')

module.exports = () => {

    const validateEmail = email =>  {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    
    const getRedirectURL = req =>  {
        let {redirect} = req.body
        if(!redirect){
            redirect = req.user.role === 'admin' ? '/admin/orders' : '/customer/orders'
        }
        return redirect
    }
    

    return {
        login(req, res) {
            let redirect = req.query.redirect
            if(redirect){
                redirect = encodeURI(req.query.redirect)
            }else{
                redirect = ''
            }
            res.render("auth/login", {redirect})
        },

        postLogin(req, res, next) {
            let { email, password } = req.body

            if(!email || !password){
                req.flash('error', 'All fields are required.')
                req.flash('email', email)
                return res.redirect('/login')
            }

            passport.authenticate('local', (err, user, info) => {
                if(err){
                    req.flash('error', info.message)
                    return next(err)
                }
                if(!user){
                    req.flash('error', info.message)
                    return res.redirect('/login')
                }
                req.login(user, (err) => {
                    if(err){
                        req.flash('error', info.message)
                        return next(err)
                    }
                    let redirect = getRedirectURL(req)
                    return res.redirect(redirect)
                })    
            })(req, res, next)
        },

        register(req, res) {
            res.render("auth/register")
        },

        async postRegister(req, res) {
            let {name, email, password} = req.body
            let hasError = false

            if(!name || !email || !password){
                req.flash('error', 'All fields are required.')
                hasError = true
            }

            if(!hasError && !validateEmail(email)){
                req.flash('error', 'Please enter valid email address.')
                hasError = true
            }

            if(!hasError){
                User.exists({email: email}, (err, result) => {
                    if(result){
                        req.flash('error', 'Email already taken.')                
                        hasError = true
                    }
                })    
            }

            if(!hasError){
                let hashedPassword = await bcrypt.hash(password, 10)

                const user = new User({
                    name,
                    email,
                    password: hashedPassword
                })
                user.save().then(user => {    
                    return res.redirect('/')
                }).catch(err => {
                    req.flash('error', 'Something went wrong.')                
                    hasError = true    
                })    
            }
            if(hasError){
                req.flash('name', name)
                req.flash('email', email)
                return res.redirect('/register')
            }

         },
         logout(req, res){
             req.logout()
             return res.redirect('/login')   
         }

    }
}