const axios = require("axios");
const fs = require("fs");
const path = require("path");

const content = fs.readFileSync(path.resolve("./word.txt")).toString('utf8').trim();

const getToken = async function () {
  return axios.get("https://aip.baidubce.com/oauth/2.0/token?", {
    params: {
      'grant_type': 'client_credentials',
      'client_id': 'gpfkCCOqQX4AMr9STZjV8o6B',
      'client_secret': '74ECmzGGeKB8AHYjiNUuPYKOqTFoy1sM'
    }
  }).then(({data: {access_token}}) => access_token)
};

const getSpam = async function (token, content) {

  return axios({
    url: "https://aip.baidubce.com/rest/2.0/antispam/v2/spam",
    method: "post",
    params: {
      access_token: token,
      content
    },
    headers: {
      ContentType: "application/x-www-form-urlencoded"
    },
    data: {
      content
    }
  }).then(({data}) => data.result)
};

const delay = async function (time) {
  return new Promise(res => {
    setTimeout(() => res(), time)
  })
}

const SpamResult = {
  1: {
    review: [],
    reject: []
  },
  2: {
    review: [],
    reject: []
  },
  3: {
    review: [],
    reject: []
  },
  4: {
    review: [],
    reject: []
  },
  5: {
    review: [],
    reject: []
  }
}

async function init() {

  console.log("开始工作")

  console.log("获取accessToken");

  const token = await getToken();

  console.log("开始验证spam 请稍后...");

  let contentArr = content.split("\n");
  let resultArr = [];
  const maxCountInEachReq = 100;

  for (let i = 0; i < contentArr.length;) {
    let contentSTR = contentArr.slice(i, i + maxCountInEachReq).join("\n");
    let spamInfo = await getSpam(token, contentSTR);
    // 存在 spam
    if (spamInfo.spam > 0){
      console.log(spamInfo);
      spamInfo.review.forEach( review => {
        if (SpamResult[review.label]){
          if (review.hit && review.hit.length > 0){
            SpamResult[review.label].review = SpamResult[review.label].review.concat(review.hit)
          }
        }

      } );

      spamInfo.reject.forEach( reject => {
        if (SpamResult[reject.label]) {
          if (reject.hit && reject.hit.length > 0){
            SpamResult[reject.label].reject = SpamResult[reject.label].reject.concat(reject.hit)
          }
        }
      } )
    }

    //每次执行完延迟.5s
    await delay(500);
    i = i + maxCountInEachReq;
  }

  console.log("结束获取spam");

  console.log("写入结果到 word.result.json中")
  fs.writeFileSync('word.result.json', JSON.stringify(SpamResult), 'utf8');
  console.log("写入完成, 你可以在文件 word.result.json 获取检查结果！")
}

init().then(() => {
}).catch(e => {
  console.error(e)
})
