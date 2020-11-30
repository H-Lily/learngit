/**
 * Created by H-Lily
 */
;(function () {
    var gameFn = function (teaMaterialTT) {
        var game=document.getElementById('gameFrame'),//获取显示对象
            DPR = 2,//屏幕比例固定为2
            gameW = game.clientWidth * DPR,//屏幕宽度
            gameH = game.clientHeight * DPR,//屏幕高度
            SR = gameW/750,
            app = new PIXI.Application(gameW,gameH,{
                transparent: true,            //设置为背景透明
            }),
            gameStage=app.stage,//舞台
            playerPos = [1,1],//移动着的初始位置
            cols = 12,//迷宫路径行数（与二维数组的行列刚好相反）18
            rows = 7,//迷宫路径列数 12
            mapArr = [],//地图数组
            cells = [],
            cupNH = 204,
            mazeMaxH = (gameH - cupNH*SR)<gameH*.9?(gameH - cupNH*SR):gameH*.9,
            cellWidth = gameW*.95/(2*rows+1)<mazeMaxH/(2*cols+1)?gameW*.95/(2*rows+1):mazeMaxH/(2*cols+1),//格子宽高
            mazeH = cellWidth*(2*cols+1),
            endPos = [2*rows,2*rows],
            endPosArr = [];

        game.appendChild(app.view);//将画布添加到界面中
        app.view.id="gameCanvas";

        function main() {
            //清空画布所有的子元素
            gameStage.removeChildren();

            //游戏构造函数
            new gamePlay();
        }

        //初始化游戏
        function gamePlay() {
            var _this = this;

            _this.TT = teaMaterialTT;

            _this.bgCont = new PIXI.Container();
            _this.midCont = new PIXI.Container();
            _this.frontCont = new PIXI.Container();
            _this.countCont = new PIXI.Container();

            gameStage.addChild(_this.bgCont,_this.midCont,_this.frontCont,_this.countCont);

            _this.gamaOver = false;//游戏是否结束

            _this.time = 20;

            //游戏操作提示
            _this.beforeGameTipFn();

            //初始化
            _this.init();

            _this.cupArr = [];

        }

        //3秒倒计时
        gamePlay.prototype.beforeGameTipFn = function () {
            var _this = this,
                bg = new PIXI.Container(),
                mid = new PIXI.Container(),
                front = new PIXI.Container(),
                Graphics = null;

            _this.countCont.addChild(bg,mid,front);
            _this.countCont.width =  gameW*.8;

            Graphics = _this.createGraphics(
                {
                    color:'0x000000',
                    alpha:.6,
                    tri:[
                        0,gameH,
                        gameW,gameH,
                        gameW,0,
                        0,0
                    ]
                }
            );
            bg.addChild(Graphics);

            //背景
            var tipBG = _this.createSprite({texture:'tipbg.png',_parent:mid,alpha:1,x:gameW*.5,y:gameH*.5,anchorX:.5,anchorY:.5,scale:SR});

            //关闭按钮
            _this.createSprite({texture:'cup-close.png',_parent:mid,alpha:1,x:gameW*.82,y:tipBG.y-tipBG.height*.44,anchorX:.5,anchorY:.5,scale:SR});

            var fontSize = 28,letterSpacing = 2;
            var style = new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: fontSize+'px',
                fill:'#fe4e51',
                fontWeight:'bold',
                letterSpacing:letterSpacing

            }),
            style2 = new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: +fontSize+'px',
                fill:'#fe4e51',
                letterSpacing:letterSpacing
            }),
            tipTxtStartY =   gameH*.28;

            _this.createText({style:style,text:'滑动屏幕',x:gameW*.5,y:tipTxtStartY,_parent:front,anchorX:.5,anchorY:0});
            var line = new PIXI.Graphics();
            line.lineStyle(4, 0xfe4e51, 1);
            line.moveTo(0, 0);
            line.lineTo(fontSize*4, 0);
            line.x = gameW*.5-fontSize*2;
            line.y = tipTxtStartY+25;
            front.addChild(line);

            _this.createText({style:style2,text:'上下左右移动人物',x:gameW*.5,y:tipTxtStartY+60,_parent:front,anchorX:.5,anchorY:0});
            _this.createText({style:style2,text:'在倒计',x:gameW*.5-fontSize*4-letterSpacing*4,y:tipTxtStartY+120,_parent:front,anchorX:.5,anchorY:0});
            _this.createText({style:style,text:'结束之前',x:gameW*.5-fontSize*.5-letterSpacing*.5,y:tipTxtStartY+120,_parent:front,anchorX:.5,anchorY:0});
            _this.createText({style:style2,text:'移出迷宫',x:gameW*.5+fontSize*3.5+letterSpacing*3.5,y:tipTxtStartY+120,_parent:front,anchorX:.5,anchorY:0});

            //人
            var bag = _this.createSprite({texture:"face.png",_parent:front,alpha:1,x:gameW*.5,y:tipTxtStartY+240,anchorX:.5,anchorY:0,scale:SR*2});
            _this.countCont.interactive = true;
            _this.countCont.buttonMode = true;
            _this.countCont.on('pointerdown',function (e) {
                _this.countCont.removeChildren();

                var leftW = (gameW-cellWidth*(2*rows+1))/2, cupArr = [];

                for(var i=1;i<=26;i++){
                    cupArr.push('cup'+i);
                }
                _this.cupArr = cupArr;

                //倒计时
                _this.countdown();
            });

        };

        //初始化游戏界面
        gamePlay.prototype.init = function () {
            var _this = this,
                bg = new PIXI.Container(),
                front = new PIXI.Container(),
                leftW = (gameW-cellWidth*(2*rows+1))/2,
                topH = (gameH-mazeH-cupNH*SR)/2;

            _this.bgCont.addChild(bg,front);//迷宫层的位置
            _this.midCont.x = leftW;
            _this.midCont.y = topH;

            //初始化位置
            playerPos = [1,1];
            endPos = [2*rows,2*rows];
            endPosArr = [];

            //倒计时
            _this.timeTxt = _this.createText({text:_this.time+'秒',x:gameW*.5,y:mazeH+109*SR*.5+topH,_parent:_this.frontCont,anchorX:1,anchorY:0});


            mapArr = primMaze(rows,cols);

            //根据地图二维数组创建墙壁
            for (var i = 0, len = mapArr.length; i < len; i++) {
                for (var j = 0, len1 = mapArr[i].length; j < len1; j++) {
                    if (mapArr[i][j]) {//是1的时候
                        var cellName = 'cell.png';
                        var cellTT = _this.TT[cellName];
                        _this.createSprite({texture:cellName,_parent:_this.midCont,alpha:1,x:i * cellWidth,y:j * cellWidth,anchorX:0,anchorY:0,scale:cellWidth/cellTT.width});

                    }
                }
            }

            //路径格子墙判断
            for (var m = 0; m < mapArr.length; m++) {
                var nowcols = mapArr [m];//checkWalls
                for (var n = 0; n < nowcols.length; n++) {
                    var walls = [true,true,true,true];
                    if(m>0&&m<mapArr.length-1&&n>0&&n<nowcols.length){
                        walls = checkWalls([m,n]);
                    }
                    cells[m][n] = {pos:nowcols[n],walls:walls}
                }
            }


            //笑脸
            var faceTT = _this.TT["face.png"];
            _this.face = _this.createSprite({texture:"face.png",_parent:_this.frontCont,alpha:1,x:cellWidth*playerPos[0]+cellWidth/2+leftW,y:cellWidth*playerPos[1]+cellWidth/2+topH,anchorX:.5,anchorY:.5,scale:cellWidth*1.35/faceTT.width});

            var px = playerPos[0];
            var py = playerPos[1];

            //监听拖动
            _this.dragFn('gameCanvas',function (direction) {
                if(_this.gamaOver)return;

                var walls = cells[px][py].walls;
                var newPos = [px,py];
                if (py > 1 && direction.up && walls[0] == false) {
                    py -= 1;//上移动
                } else if (py < cols*2 && direction.down && walls[2] == false) {
                    py += 1;//下移动
                } else if (px < 2*rows-1  && direction.right && walls[1] == false) {
                    px += 1;//右移动
                } else if (px > 1 && direction.left && walls[3] == false) {
                    px -= 1;//左移动
                }

                if (newPos[0]!= playerPos[0]||newPos[1]!= playerPos[1]) {//是新的位置呀

                    playerPos = newPos;

                    if (playerPos[0]==endPos[0]&&playerPos[1]==endPos[1]) {
                        _this.gamaOver = true;
                    }
                    TweenMax.to(_this.face, .08, {x:cellWidth*playerPos[0]+cellWidth/2+leftW,repeat:0,yoyo:true,ease:Linear.easeOut,delay:0,onComplete:function () {}});
                    TweenMax.to(_this.face, .08, {y:cellWidth*playerPos[1]+cellWidth/2+topH,repeat:0,yoyo:true,ease:Linear.easeOut,delay:0,onComplete:function () {
                            if (playerPos[0]==endPos[0]&&playerPos[1]==endPos[1]) {
                                TweenMax.to(_this.face, .5, {y:mazeH+cupNH*SR*.7+topH,alpha:.5,repeat:0,yoyo:true,ease:Linear.easeOut,delay:0,onComplete:function () {
                                        setTimeout(function () {
                                            console.log('游戏成功');
                                        }, 800);
                                    }});
                            }
                        } });
                }
            });
        };

        //返回拖动方向
        gamePlay.prototype.dragFn = function (id,fn) {
            var _this = this,
                startX,
                startY,
                prevX = '',
                prevY= '',
                hadCont = false,
                moveDistance = cellWidth/DPR;
            touch.on('#'+id, 'touchstart', function(ev){
                startX = ev.x;
                startY = ev.y;
            });
            touch.on('#'+id, 'drag', function(ev){
                if(_this.gamaOver)return;
                var direction = {
                    right:false,
                    left:false,
                    down:false,
                    up:false
                };

                if(!hadCont){
                    prevX = ev.x;
                    prevY = ev.y;
                    hadCont  = true;
                }else{
                    if(ev.x-prevX>moveDistance){//向右
                        prevX = ev.x;
                        direction.right  = true;
                        direction.left  = false;
                    }
                    if(ev.x-prevX<-moveDistance){//向左
                        prevX = ev.x;
                        direction.right  = false;
                        direction.left  = true;
                    }
                    if(ev.y-prevY>moveDistance){//向下
                        prevY = ev.y;
                        direction.up  = false;
                        direction.down  = true;
                    }
                    if(ev.y-prevY<-moveDistance){//向上
                        prevY = ev.y;
                        direction.up  = true;
                        direction.down  = false;
                    }
                    if(fn){fn(direction)}
                }


            });
            touch.on('#'+id, 'dragend', function(ev){
                prevX = '';
                prevY= '';
            });
        };

        /**
         *  创建精灵
         * @param spOpt ttName  _parent alpha x y rotation anchorX  anchorY
         * @param fn
         */
        gamePlay.prototype.createSprite = function (spOpt,fn) {
            var _this = this,
                texture  =  _this.TT[spOpt.texture],
                spr = new PIXI.Sprite(texture),
                p = spOpt._parent;

            spr.x = spOpt.x;
            spr.y = spOpt.y;
            spr.anchor.x = spOpt.anchorX||0;
            spr.anchor.y = spOpt.anchorY||0;
            spr.rotation = spOpt.rotation||0;
            spr.scale.set(spOpt.scale?spOpt.scale:(gameW/texture.width),spOpt.scale?spOpt.scale:(gameH/texture.height));
            spr.alpha = spOpt.alpha;
            p.addChild(spr);
            if(fn){fn(spr)}
            return spr ;
        };

        //创建文字
        gamePlay.prototype.createText = function (opt) {
            var _this = this,
                opt = opt,
                style = new PIXI.TextStyle({
                    fontFamily: 'Arial',
                    fontSize: '45px',
                    fontWeight:opt.fontWeight||'normal',//
                    // fill: ['#ffba27','#f98d11'], // gradient
                    fill:opt.color||['#ffba27','#f98d11'], // gradient
                    wordWrap: true,
                    wordWrapWidth: 440
                }),
                message = new PIXI.Text(opt.text,opt.style||style);

            message.anchor.set(.5,.5);
            message.x = opt.x;
            message.y = opt.y;
            opt._parent.addChild(message);
            return message
        };

        /**
         * 栅格线条  gameW  gameH  cellWidth
         */
        gamePlay.prototype.drawGrid = function () {
            var _this = this;
            var stepx = cellWidth;
            var stepy = cellWidth;

            for (var i = stepx + 0.5; i < gameH; i += stepx) {
                var line = new PIXI.Graphics();
                line.lineStyle(1, 0xff2e05, 1);
                line.moveTo(0, 0);
                line.lineTo(gameW, 0);
                line.x = 0;
                line.y = i;
                _this.bgCont.addChild(line);

            }
            for (var i = stepy + 0.5; i < gameW; i += stepy) {
                var line = new PIXI.Graphics();
                line.lineStyle(1, 0x00b3fe, 1);
                line.moveTo(0, 0);
                line.lineTo(0, gameH);
                line.x = i;
                line.y = 0;
                _this.bgCont.addChild(line);
            }

        };

        //创建多边形
        gamePlay.prototype.createGraphics = function (data) {
            var triangle = new PIXI.Graphics();
            var option = data;
            var color = option.color||'0x66FF33';
            triangle.beginFill(color);
            triangle.drawPolygon(option.tri);
            triangle.endFill();
            triangle.x = option.x||0;
            triangle.y = option.y||0;
            triangle.alpha = option.alpha||.96;
            return triangle;
        };

        //创建倒计时
        gamePlay.prototype.countdown = function () {
            var _this = this;

            setTimeout(function() {
                if(_this.gamaOver)return;
                _this.time--;
                _this.timeTxt.text= _this.time+'秒';
                
                if(_this.time==0){
                    _this.gamaOver = true;
                    console.log('失败！');
                    setTimeout(function () {
                        console.log('游戏失败');
                    },800);
                }else{
                    _this.countdown();
                }
            },1000);
        };

        //取区域随机数x>=min && x<max
        function randInt(min,max) {
            max=max||0;
            min=min||0;
            var step=Math.abs(max-min);
            var st = (arguments.length<2)?0:min;//参数只有一个的时候，st = 0;
            var result ;
            result = st+(Math.ceil(Math.random()*step))-1;
            return result;
        }

        //普里姆算法生成连通图的二维数组
        // row 行 column 列
        function primMaze(r, c) {
            //初始化数组
            function init(r, c) {

                var a = new Array(2 * r + 1);
                cells = new Array(2 * r + 1);
                //全部置1
                for (let i = 0, len = a.length; i < len; i++) {
                    var cols = 2 * c + 1;
                    a[i] = new Array(cols);
                    cells[i] = new Array(cols);
                    for(let j=0,len1=a[i].length;j<len1;j++)
                    {
                        a[i][j]=1;
                        cells[i][j]={pos:1};
                    }
                }
                //中间格子为0
                for (let i = 0; i < r; i++)
                    for (let j = 0; j < c; j++) {
                        a[2 * i + 1][2 * j + 1] = 0;
                    }
                return a;
            }

            //处理数组，产生最终的数组
            function process(arr) {
                //acc存放已访问队列，noacc存放没有访问队列
                var acc = [], noacc = [];
                var r = arr.length >> 1,
                    c = arr[0].length >> 1;
                var count = r * c;
                for (var i = 0; i < count; i++) {
                    noacc[i] = 0;
                }
                //定义空单元上下左右偏移
                var offs = [-c, c, -1, 1],
                    offR = [-1, 1, 0, 0],
                    offC = [0, 0, -1, 1];

                //随机从noacc取出一个位置
                var pos = randInt(count);
                noacc[pos] = 1;

                //放入已访列表
                acc.push(pos);
                while (acc.length < count) {
                    var ls = -1, offPos = -1;
                    offPos = -1;
                    //找出pos位置在二维数组中的坐标
                    var pr = pos / c | 0, pc = pos % c, co = 0, o = 0;

                    //随机取上下左右四个单元
                    while (++co < 5) {
                        o = randInt(0, 5);//0,1,2,3,4
                        ls = offs[o] + pos;
                        var tpr = pr + offR[o];
                        var tpc = pc + offC[o];
                        if (tpr >= 0 && tpc >= 0 && tpr <= r - 1 && tpc <= c - 1 && noacc[ls] == 0) {
                            offPos = o;
                            break;
                        }
                    }




                    if (offPos < 0) {
                        pos = acc[randInt(acc.length)];
                    }else {
                        pr = 2 * pr + 1;
                        pc = 2 * pc + 1;
                        //相邻空单元中间的位置置0
                        arr[pr + offR[offPos]][pc + offC[offPos]] = 0;

                        if(pc + offC[offPos]==2*cols-1){
                            // arr[pr + offR[offPos]][pc + offC[offPos]+1] = 0;
                            // hadEnd = true;
                            var pos = [pr + offR[offPos],pc + offC[offPos]+1];
                            endPosArr.push(pos);

                        }
                        pos = ls;
                        noacc[pos] = 1;
                        acc.push(pos);
                    }
                }

                //设置出口坐标
                // endPos = endPosArr[randInt(0,endPosArr.length-1)];
                endPos = [arr.length-2,arr[0].length-1];
                arr[endPos[0]][endPos[1]] = 0;
            }

            var a = init(r, c);

            process(a);

            return a;
            //返回一个二维数组，行的数据为2r+1个,列的数据为2c+1个
        }

        //检测当前格子四周墙壁情况
        function checkWalls(playerPos) {
            var x = playerPos[0],
                y = playerPos[1],
                walls = [true,true,true,true];//当前格子上右下左是否是墙壁

            if(mapArr[x][y-1]==0){//上
                walls[0] = false;
            }
            if(mapArr[x+1][y]==0){//右
                walls[1] = false;
            }
            if(mapArr[x][y+1]==0){//下
                walls[2] = false;
            }
            if(mapArr[x-1][y]==0){//左
                walls[3] = false;
            }

            return walls;

        }

        main();
        window.gameFnMain=main;

    };

    window.gameFn = gameFn;

})();