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
        /* 
            @page 页码 Number
            @pageSize 一页个数 Number
            @type todos类型 String | Number
        
        */
        const page = Number(ctx.query.page) || 1;
        const pageSize = Number(ctx.query.pageSize) || 5;
        const type = ctx.query.type || '';

        let where = '';
        if (type) {
            where = `WHERE done=${type}`
        }

        const sql = `SELECT title,done,id FROM todos ${where}`
        const [todosAll] = await connection.query(sql);
        const totalPage = Math.ceil(todosAll.length / pageSize);

        const sql2 = `SELECT title,done,id FROM todos ${where} LIMIT ${pageSize} OFFSET ${(page-1)*pageSize}`
        const [todos] = await connection.query(sql2)

        ctx.body = {
            code: 0,
            data: {
                data: todos,
                totalPage
            }
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
                code: 2,
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
                code: 2,
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

        const sql = 'UPDATE todos SET ??=? WHERE ??=?'

        const [res] = await connection.query(sql,['done',done,'id',id])

        if (res.affectedRows > 0) {
            ctx.body = {
                code: 0,
                msg: '修改成功',
            }
        } else {
            ctx.body = {
                code: 2,
                msg: '修改失败，请联系管理员。',
            }
        }
    })





    // console.log(users);
    app.use(router.routes())

    app.listen(80)

})()