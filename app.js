const express = require('express')
const cookieparser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks=require('nunjucks');
const dotenv=require('dotenv');
const passport = require('passport');
const helmet = require('helmet');
const hpp = require('hpp');
const redis = require('redis');
const RedisStore = require('connect-redis')(session)
//반드시 세션을 인수로 넣어서 호출해야함
//connect-redis 는 express-session에 의존성이 있음

dotenv.config();
const redisClient = redis.createClient({
    //redis의 createClient 메서드로 redisClient 객체 생성
    //dotenv.config()보다 코드가 아래에 있어야 함 반드시.
    //왜냐하면 env파일을 쓰기 때문
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    password: process.env.REDIS_PASSWORD,
});
const pageRouter=require('./routes/page');
const authRouter=require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const {sequelize}=require('./models');//db모델을 서버와 연결하기 위함
const logger=require('./logger');

const passportConfig = require('./passport');//passport모듈 index.js가 뒤에 생략된 것
//passport모듈은 세션이나 쿠키기능을 우리가 다 구현하기엔 보안상 무리도 있기 때문에
//이렇게 모듈을 들고와서 씀 이걸로 카카오나 페이스북 등을 연동하여 로그인 가능

const app=express();
passportConfig();//패스포트 설정
app.set('port',process.env.PORT||8001);
app.set('view engine','html');
nunjucks.configure('views',{
    express:app,
    watch:true,
});
sequelize.sync({force:false})
    .then(()=>{
        console.log('데이터 베이스 연결 성공');
    })
    .catch((err)=>{
        console.error(err);
    });
//index.js에서 db를 불러와서 sync메서드를 사용해 서버 실행 시 MYSQL과 연동되는 것
//force:false 옵션을 true로 설정하면 서버 실행 시마다 테이블을 재생성함
//테이블 잘못 만든 경우에 true로 설정함

if(process.env.NODE_ENV === 'production'){
    //process.env.NODE_ENV는 배포환경인지 개발환경인지 판단할 수 있는 환경변수
    app.use(morgan('combined'));//배포환경일 때 combined모드로
    //combined모드에서는 dev모드에 비해 더 많은 사용자 정보를 로그로 남김->추후 버그 해결할 때 유용하게 사용
    //process.env.NODE_ENV 는 .env 에 넣을 수 없음
    //개발환경에 따라서 combined , dev 가 변해야 하는데 .env 는 정적 파일이라 불가능.
    //후에 process.env.NODE_ENV 를 동적으로 바꾸는 방법은 cross-env에서 알아볼 것
    app.use(helmet());
    app.use(hpp());
    //이 두 패키지는 배포 전에 넣어주는 것이 좋음
    //때때로 너무 엄격한 보안 규칙 때문에 적용시 방해 될 수 있으므로 공식 문서를 보고 필요없는 옵션은 해제해야함

}else{
    app.use(morgan('dev'));//개발 모드일 때 dev로
}
//app.use(morgan('dev'));
app.use(express.static(path.join(__dirname,'public')));
//static 미들웨어는 정적인 파일들을 제공하는 라우터 역할
//기본제공 되므로 express객체 안에서 꺼내서 사용
//app.use('요청경로',express.static('실제경로'));
app.use('/img',express.static(path.join(__dirname,'uploads')));
//업로드 폴더 내 사진들이 /img주소로 제공됨
//express.static은 여러번 쓸 수 있다는 것을 기억
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieparser(process.env.COOKIE_SECRET));
const sessionOption={
    resave:false,
    saveUninitialized:false,
    secret:process.env.COOKIE_SECRET,
    cookie:{
        httpOnly:true,
        secure:false,
    },
    store: new RedisStore({ client: redisClient }),
    //express-session 미들웨어에는 store옵션 추가
    //기본값은 메모리에 저장했지만 이제 RedisStore에 저장함
    //RedisStore 옵션으로 client 속성에 redisClient 객체를 연결하면 됨
};
if(process.env.NODE_ENV === 'production'){
    sessionOption.proxy=true;
}
app.use(session(sessionOption));
/*
app.use(session({
    resave:false,
    saveUninitialized:false,
    secret:process.env.COOKIE_SECRET,
    cookie:{
        httpOnly:true,
        secure:false,
    },
}));
*/
app.use(passport.initialize());
app.use(passport.session());
app.use('/',pageRouter);

app.use('/auth',authRouter);
app.use('/post',postRouter);
app.use('/user',userRouter);

app.use((req,res,next)=>{
    const error=new Error(`${req.method} ${req.url}라우터가 없습니다.`);
    error.status=404;
    logger.info('hello');
    logger.error(error.message);
    next(error);
});

app.use((err,req,res,next)=>{
    res.locals.message=err.message;
    res.locals.error=process.env.NODE_ENV !=='production'? err:{};
    res.status(err.status||500);
    res.render('error');
});

module.exports=app;
