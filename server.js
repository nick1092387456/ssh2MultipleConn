const fs = require('fs')
const { Client } = require('ssh2')
const path = require('path')
const process = require('process')
const now = new Date()
require('dotenv').config({
  path: path.resolve(__dirname, './config', '.env'),
})

//解析env中有幾個裝置
const deviceIPList = process.env.ADDRESS.split(',')
const usernameList = process.env.USER.split(',')
const passwordList = process.env.PASSWORD.split(',')
const deviceAmount = deviceIPList.length

//依裝置數量建立相同大小的陣列
const conn_Array = new Array(deviceAmount)

//建立一個創建連線的function並指定參數index，之後執行loop時要使用
function createConn(index) {
  return new Promise((res) => {
    conn_Array[index] = new Client()
    conn_Array[index]
      .on('ready', () => {
        console.log('Client :: ready')
        conn_Array[index].shell((err, stream) => {
          if (err) throw err
          let consoleMessage = ''
          stream
            .on('close', () => {
              console.log('Stream :: close')
              conn_Array[index].end(res())
              //寫下Log
              fs.writeFile(
                path.resolve(__dirname, './log', `${deviceIPList[index]}.txt`),
                consoleMessage,
                (err) => console.log(err)
              )
            })
            .on('data', (data) => {
              console.log('OUTPUT: ' + data)
              consoleMessage += data.toString()
            })
          stream.write('ls -l\nexit\n')
        })
      })
      //connect若出現無法連線的狀況，可以把所有演算法都貼上
      .connect({
        host: deviceIPList[index],
        port: 22,
        username: usernameList[index],
        password: passwordList[index],
        algorithms: {
          kex: [
            'diffie-hellman-group1-sha1',
            'ecdh-sha2-nistp256',
            'ecdh-sha2-nistp384',
            'ecdh-sha2-nistp521',
            'diffie-hellman-group-exchange-sha256',
            'diffie-hellman-group14-sha1',
          ],
          cipher: [
            '3des-cbc',
            'aes128-ctr',
            'aes192-ctr',
            'aes256-ctr',
            'aes128-gcm',
            'aes128-gcm@openssh.com',
            'aes256-gcm',
            'aes256-gcm@openssh.com',
          ],
          serverHostKey: [
            'ssh-rsa',
            'ecdsa-sha2-nistp256',
            'ecdsa-sha2-nistp384',
            'ecdsa-sha2-nistp521',
          ],
          hmac: ['hmac-sha2-256', 'hmac-sha2-512', 'hmac-sha1'],
        },
      })
  })
}

//依裝置數量執行 CreatConn function
;(async () => {
  try {
    for (let i = deviceAmount - 1; i >= 0; i--) {
      await createConn(i)
    }
  } catch (err) {
    console.log(err)
  }
})()
