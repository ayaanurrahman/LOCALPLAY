const isAdmin = (req,res,next) =>{

    // checking if the user role is admin 
    if(req.user && req.user.role === "admin"){

        // if user is an admin then only parse the next function 
        next()
    }else{
        res.status(403).json({
            "message" : "Access denied admins only."
        })
    }
}

module.exports = {isAdmin}