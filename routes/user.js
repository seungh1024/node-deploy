const express = require('express');

const {isLoggedIn} = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

router.post('/:id/follow',isLoggedIn,async(req,res,next)=>{
    // Post /user/:id/follow 라우터
    //:id 부분이 req.params.id가 됨
    try{
        const user = await User.findOne({where:{id:req.user.id}});
        //먼저 팔로우할 사용자를 데이터베이스에서 조회함
        if(user){
            await user.addFollowing(parseInt(req.params.id,10));
            //addFollowing메서드로 현재 로그인한 사용자와의 관계를 지정함
            res.send('success');
        }else{
            res.status(404).send('no user');
        }
    }catch(error){
        console.error(error);
        next(error);
    }
});

module.exports=router;