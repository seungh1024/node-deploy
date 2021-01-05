const {createLogger, format, transports} = require('winston');

const logger = createLogger({
    //winston 패키지의 createLogger 메서드로 logger를 만듦 인수로 설정을 넣어줄 수 있음
    level:'info',
    //level은 로그의 심각도를 의미함. error,warn,info,verbose,debug,silly 가 있음
    //심각도순으로 나열한 것
    //기록하길 원하는 유형의 로그를 고르면 됨. 그 고른것보다 심각한 단계의 로그도 같이 기록됨.
    format: format.json(),
    //로그의 형식
    //json,label,timestamp, printf,simple,combine 등의 다양한 형식 제공
    //기본적으로 json 형식으로 기록하지만 로그시간을 기록하려면 timestamp 이용하는게 좋음
    //combine은 여러 형식을 혼합할 때 사용.사용방법은 공식문서 참조
    transports:[
        new transports.File({filename:'combined.log'}),
        new transports.File({filename: 'error.log',level:'error'}),
    //transports는 로그 저장 방식을 의미함
    //new transports.File은 파일로 저장한다는 뜻 ->파일이름 설정 가능
    //.Console은 콘솔에 출력한다는 뜻
    //여러 로깅방식을 동시에 사용 가능함
    //배포 환경이 아닌 경우 파일뿐 아니라 콘솔에서도 출력함
    //이 메서드에도 level,format 등을 설정할 수 있음
    ],
});

if(process.env.NODE_ENV !== 'production'){
    logger.add(new transports.Console({ format: format.simple() }));
}

module.exports = logger;
//logger 객체를 만들어 다른 파일에서 사용하면 됨