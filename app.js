(async function() {
    const Koa = require('koa')
    const Static = require('koa-static-cache')
    const Router = require('koa-router')
    const mysql = require('mysql2/promise')
    const fs = require('fs')
    const BodyParser = require('koa-bodyparser')

    const app = new Koa()
    const router = new Router()

    app.use(Static('./static', {
        prefix: '/static',
        gzip: true,
    }))

    app.use(BodyParser())

    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'miaov',
    })

    router.get('/', ctx => {
        // 默认读取是流 二进制文件
        const content = fs.readFileSync('./static/index.html')
        // 将二进制流转为字符串
        ctx.body = content.toString()
    })

    router.get('/todos', async ctx => {
        // 返回一个数组，第一项为查询的记录数组，第二项为记录的属性
        let [data] = await connection.query('SELECT title,done,id FROM todos ORDER BY id DESC')

        ctx.body = {
            code: 0,
            data
        };
    })

    router.post('/add', async ctx => {
        const title = ctx.request.body.title || '';
        if (title === '') {
            ctx.body = {
                code: 1,
                msg: 'title不能为空'
            }
            return
        }

        const [res] = await connection.query(`INSERT INTO todos (title) VALUES ('${title}')`)

        if (res.affectedRows > 0) {
            ctx.body = {
                code: 0,
                msg: '添加成功',
            }
        } else {
            ctx.body = {
                code: 0,
                msg: '添加失败，请联系管理员。',
            }
        }
    })

    router.post('/remove', async ctx => {
        const id = ctx.request.body.id || '';
        if (id === '') {
            ctx.body = {
                code: 1,
                msg: 'id不能为空！'
            }
            return
        }

        const [res] = await connection.query(`DELETE FROM todos WHERE id=${id}`)

        if (res.affectedRows > 0) {
            ctx.body = {
                code: 0,
                msg: '删除成功',
            }
        } else {
            ctx.body = {
                code: 0,
                msg: '添加失败，请联系管理员。',
            }
        }
    })

    router.post('/update', async ctx => {
        const id = ctx.request.body.id || '';
        const done = ctx.request.body.done || 0;

        if (id === '') {
            ctx.body = {
                code: 1,
                msg: 'id不能为空！'
            }
            return
        }

        const [res] = await connection.query(`UPDATE todos SET done=${done} WHERE id=${id}`)

        if (res.affectedRows > 0) {
            ctx.body = {
                code: 0,
                msg: '修改成功',
            }
        } else {
            ctx.body = {
                code: 0,
                msg: '修改失败，请联系管理员。',
            }
        }
    })





    // console.log(users);
    app.use(router.routes())

    app.listen(80)

})()