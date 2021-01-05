require('dotenv').config();

module.exports={
    development:{
        username:'root',
        password:process.env.SEQUELIZE_PASSWORD,
        database:'nodebird',
        host:'127.0.0.1',
        dialect:'mysql',
    },
    test:{
        username:'root',
        password:process.env.SEQUELIZE_PASSWORD,
        ddatabase:'nodebird_test',
        host:'127.0.0.1',
        dialect:'mysql',
    },
    production:{
        username:'root',
        password:process.env.SEQUELIZE_PASSWORD,
        database:'nodebird',
        host:'127.0.0.1',
        dialect:'mysql',
        logging:false,
        //production(배포)일 경우에는 loggingdp false를 줘서 쿼리 명령어를 콘솔에 나오지 않게 함
    }
}
//js 파일-> dotenv 모듈 사용 가능
//예제에서는 password만 process.env로 바꾸었지만 보안 규칙에 따라 다른 정보들도 바꿔도 됨
//username,host속성은 각각 아이디와 db서버 주소 역할을 하므로 숨기는게 좋음