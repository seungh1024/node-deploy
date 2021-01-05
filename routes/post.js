const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {Post,Hashtag} = require('../models');
const {isLoggedIn}=require('./middlewares');

const router = express.Router();

try{
    fs.readdirSync('uploads');
}catch(error){
    console.error('uploads 폴도가 없어 uploads 폴더를 생성합니다');
    fs.mkdirSync('uploads');
}

const upload = multer({
    storage:multer.diskStorage({
        destination(req,file,cb){
            cb(null,'uploads/');
        },
        filename(req,file,cb){
            const ext= path.extname(file.originalname);
            cb(null,path.basename(file.originalname,ext)+Date.now()+ext);
        },
    }),
    limits:{fileSize:5*1024*1024},
});

router.post('/img',isLoggedIn,upload.single('img'),(req,res)=>{
    //app.use('/post')를 할 것 이므로 router.post 로 경로를 설정함
    //여기서 이미지 하나를 업로드 받음 upload.single('img')
    //이 경로의 정적 파일을 제공하므로 클라이언트에서 업로드 한 이미지를 볼 수 있음. json형태로 전송함
    console.log(req.file);
    res.json({url:`/img/${req.file.filename}`});
});

const upload2 = multer();
router.post('/',isLoggedIn,upload2.none(),async(req,res,next)=>{
    //Post /post 라우터는 게시글 업로드를 처리하는 라우터
    //upload2.none()dmf tkdydgks dldbsms multipart이지만 이미지 데이터가 들어있지는 않기 때문
    //주소만 온 것 이미지는 Post /post/img 라우터에서 이미 저장됨
    try{
        const post = await Post.create({
            content:req.body.content,
            img:req.body.url,
            UserId:req.user.id,
            //게시글을 데이터 베이스에 저장함
        });
        const hashtags=req.body.content.match(/#[^\s#]+/g);
        //게시글 내용에서 해시태그를 정규표현식 /#[^\s#]+/g 로 추출함
        if(hashtags){//해시태그가 있다면
            const result = await Promise.all(
                //Promise.all로 여러 해시태그를 findOrcreate로 모두 실행
                hashtags.map(tag=>{
                    //hashtags.map으로 각각 파싱함
                    return Hashtag.findOrCreate({//findOrCreate 메서드로 저장
                        //이 시퀄라이즈 메서드는 디비에 해시태그가 존재하면 가져오고
                        //존재하지 않으면 생성한 후 가져옴
                        where:{title:tag.slice(1).toLowerCase()},
                        //slice(1)로 맨 앞의 #을 제외하고 toLowerCase()로 소문자로 바꿈
                    })
                }),
            );
            await post.addHashtags(result.map(r=>r[0]));
            //결괏값으로 [모델,생성 여부]를 반환하므로
            //result.map(r=>[0])으로 모델만 추출 [모델,bool]이 여러개인 배열형태로
            //추출 후에 post.addHasgtags 메서드로 게시글과 연결함
        }
        res.redirect('/');
    }catch(error){
        console.error(error);
        next(error);
    }
});

module.exports=router;