//add event listener for torustictactoe button
const tictactoeinit = (test) => {
    //clear child elements of game div
    document.querySelector('#game').textContent = ' ';
    document.querySelector('#instructions').textContent = ' ';
    //append instructions
    let instr = document.createElement('p');
    instr.textContent = 'Double Click the Torus (Donut) to Place X or O. Click and Drag to change view. Alternate with a Friend!';
    document.querySelector('#instructions').appendChild(instr);
    //initialize camera, scene, renderer, add Orbital Controls
    const R = 5
    const r = 2.5;
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.set(0,0,30);
    camera.lookAt(0,0,0);

    const scene =  new THREE.Scene();

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight);
    document.getElementById("game").appendChild( renderer.domElement );

    let gameSkin = document.createElement('canvas');	
    gameSkin.width = 400;
    gameSkin.height = 200;
    let context = gameSkin.getContext('2d');
    var texture = new THREE.CanvasTexture(gameSkin);
    //
    let background = document.createElement('canvas');
    background.width = window.innerWidth;
    background.height = window.innerHeight;
    backgroundContext = background.getContext('2d');
    backgroundContext.fillRect(0, 0, background.width, background.height);
    
    var backgroundTexture = new THREE.CanvasTexture(background);
    scene.background = backgroundTexture;
    //

    const controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.minDistance = 5;

    let game = {//game logic
        board: [['.','.','.'],
                ['.','.','.'],
                ['.','.','.']],
        next: "X", 
        newMove: false,
        row:0,
        col:0,
        winner:'\0',
    }

    //create torus mesh and add to scene 
    let torus = new THREE.Mesh(
        new THREE.TorusGeometry(R, r, 20, 50),
        new THREE.MeshBasicMaterial({ 
            map: drawLines(),
    }));


    const mouse = new THREE.Vector2();//coordinates of mouse
    const raycaster = new THREE.Raycaster();//shoots rays


    let intersections;

    renderer.domElement.addEventListener( 'mousemove', onMouseMove, false );//keep ptr coordinates up to date  
    window.addEventListener('resize', onWindowResize, false);
    renderer.domElement.addEventListener('dblclick', () => //on click, check if torus hit
    {
        intersections = raycaster.intersectObject(torus);
        
        if(intersections.length>0)
        {
            if(setBoardPos(intersections[0]) === true)
            {
                if(checkWin()){
                    console.log(game.next, 'won');
                    game.winner = game.next;
                    //drawLines();
                    texture.needsUpdate = true;
                    backgroundTexture.needsUpdate = true;
                }
                else{
                    game.newMove = true;
                    if(game.next === 'O'){
                        game.next = 'X';
                    }
                    else{
                        game.next = 'O';
                    }
                }
                
            }
        }
        
    });


    scene.add( torus );

    animate();//start animation
    /**
     * Function called after each turn to check if the current player has won
     * @returns {boolean} whether the player has won
     */
    function checkWin()
    {
        
        if( (game.board[game.row][(game.col+1)%3] === game.next && game.board[game.row][(game.col+ 2)%3] === game.next) ){
            drawLines(true, 'hor');
            return true;
        }
        else if( (game.board[(game.row + 1)%3][game.col] === game.next && game.board[(game.row + 2)%3][game.col] === game.next) )
        {
            drawLines(true, 'ver');
            return true;
        }
        else if( (game.board[(game.row+1)%3][(game.col+1)%3] === game.next && game.board[(game.row+2)%3][(game.col+2)%3] === game.next) ){
            drawLines(true, 'rd');
            return true;
        }
        else if ( (game.board[(game.row+1)%3][mod(game.col-1,3)] === game.next && game.board[(game.row+2)%3][mod(game.col-2,3)] === game.next) ){
            drawLines(true, 'ld');
            return true;
        }
        else{
            return false;
        }
        
    }
    /**
     * Function called after each turn to check if the current player has won
     * @param {object} intersect the object representing the 3d location of the intersection point
     * @returns {boolean} whether the symbol was drawn on the board
     */
    function setBoardPos(intersect)
    {
        x = intersect.point.x;
        y = intersect.point.y;
        z = intersect.point.z;
        let row, col;
        if(Math.sqrt(Math.pow(x,2) + Math.pow(y,2)) < (R + (r*Math.cos(2*Math.PI/3))) ){
            row = 1;
        }
        else{
            if(z>0){
                row = 2;
            }
            else{
                row = 0;
            }
        }
        if( x < Math.sqrt(Math.pow(x,2) + Math.pow(y,2))*Math.cos(2*Math.PI/3) ){
            col = 1;
        }
        else{
            if(y>0){
                col = 0;
            }
            else{
                col = 2;
            }
        }
        if(game.board[row][col] === '.' && game.winner === '\0'){
            game.row=row;
            game.col=col;
            game.board[row][col] = game.next;
            return true;
        }
        else{
            return false;
        }
    }
    /**
     * callback function sets mouse object's x position and y position (helps with window scrolling)
     * @param {object} event represents information about the window to be used for calculating mouse position
     */
    function onMouseMove( event ) {//helper function, gets mouse x and y coordinates
        var rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ( ( event.clientX - rect.left ) / ( rect.width - rect.left ) ) * 2 - 1;
        mouse.y = - ( ( event.clientY - rect.top ) / ( rect.bottom - rect.top) ) * 2 + 1;
        //console.log(mouse.x,mouse.y);//debugging
    }
    /**
     * callback function adjusts renderer and camera for window resizing
     */
    function onWindowResize(){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }
    /**
     * main loop calling the renderer and displaying the scene
     * redraws the game board after each move and instantiates the 
     * raycaster checking for a hit on each double click
     */
    function animate() {//function animating the scene
        //if drawUpdate -> draw, setDrawUpdate false
        if(game.newMove){
            drawLines();
            game.newMove = false;
            texture.needsUpdate = true;
            backgroundTexture.needsUpdate = true;
        }
        requestAnimationFrame( animate );
        renderer.render( scene, camera );
        raycaster.setFromCamera(mouse, camera);//rays shot from camera
        
    }
    /**
     * function draws symbols onto the canvas
     * @param {string} winner optional argument for use if a player wins
     * @param {string} dir gives information about the direction of the winning symbols
     */
    function drawLines(winner, dir){//function for drawing on torus
        
        
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, gameSkin.width, gameSkin.height);
        for(let i=0; i<3; i++)
        {
            context.beginPath();
            context.moveTo((gameSkin.width/3)*i, 0);
            context.lineTo((gameSkin.width/3)*i, gameSkin.height);
            context.strokeStyle = '#000000';
            context.lineWidth = 2;
            context.stroke();

            context.beginPath();
            context.moveTo(0, (gameSkin.height/3)*i);
            context.lineTo(gameSkin.width, (gameSkin.height/3)*i);
            context.strokeStyle = '#000000';
            context.lineWidth = 2;
            context.stroke();

            context.font = '50pt Arial';
            context.fillStyle = '#ff0000';
            
        }
        for(let i=0; i<3; i++){
            for(let j=0; j<3; j++)
            {
                let character = game.board[i][j];
                if(character!= '.')
                {
                    context.fillText(character,(gameSkin.width/9)+(gameSkin.width/3)*j, (gameSkin.height*3/10)+(gameSkin.height/3)*i)
                }
            }
        }
        if(winner)
        {
            context.strokeStyle = '#00FF00';
            context.lineWidth = 2;
            switch(dir){
                case 'hor':
                    context.beginPath();
                    context.moveTo(0, (gameSkin.height*game.row/3)+(gameSkin.height/6));
                    context.lineTo(gameSkin.width, (gameSkin.height*game.row/3)+(gameSkin.height/6));
                    context.stroke();
                    break;
                case 'ver':
                    context.beginPath();
                    context.moveTo((gameSkin.width*game.col/3)+(gameSkin.width/6), 0);
                    context.lineTo((gameSkin.width*game.col/3)+(gameSkin.width/6), gameSkin.height);
                    context.stroke();
                    break;
                case 'rd':
                    context.beginPath();
                    for(let i=0; i<3; i++){
                        context.beginPath();
                        context.moveTo( ((game.col+i)%3) * (gameSkin.width/3), ((game.row+i)%3) *(gameSkin.height/3));
                        context.lineTo( ((game.col+i)%3+1) * (gameSkin.width/3), ((game.row+i)%3+1) *(gameSkin.height/3));
                        context.stroke();
                    }
                    break;
                case 'ld':
                    for(let i=0; i<3; i++){
                        context.beginPath();
                        context.moveTo( (mod(game.col-i,3)+1) * (gameSkin.width/3), ((game.row+i)%3) *(gameSkin.height/3));
                        context.lineTo( mod(game.col-i,3) * (gameSkin.width/3), ((game.row+i)%3+1) *(gameSkin.height/3))
                        context.stroke();
                    }
                    break;
            }
        }
        backgroundContext.drawImage(gameSkin,0,0);
        return texture;//for texture mapping purposes
    }
    /**
     * function returning the remainder of the division algorithm (works with negative numbers)
     * @param {number} n operand
     * @param {number} m divisor
     */
    function mod(n, m) {
        return ((n % m) + m) % m;
    }



    //testing for on-click test
    if(test){
        //test 1
        function t1(){
            dbOut("Test 1: ", false, "#tttOutput");
            game.board = [['.','.','.'],
            ['X','X','.'],
            ['.','.','.']];
            game.row = 1;
            game.col = 1;
            if(checkWin() === true){
                dbOut("FAILED", true, "#tttOutput");
            }
            else{
                game.board[1][2] = 'X';
                game.col = 2;
                if(checkWin() === true){
                    dbOut("PASSED", true, "#tttOutput");
                }
                else{
                    dbOut("FAILED", true, "#tttOutput");
                }
            }
        }
        function t2(){
            dbOut("Test 2: ", false, "#tttOutput");
            game.board = [['O','.','.'],
            ['X','O','.'],
            ['.','.','.']];
            game.row = 0;
            game.col = 0;
            game.next = 'O';
            if(checkWin() === true){
                dbOut("FAILED", false,"#tttOutput");
            }
            else{
                game.next = 'X';
                game.board[1][2] = 'X';
                game.next = 'O';
                game.board[2][2] = 'O';
                game.row = 2;
                game.col = 2;
                if(checkWin() === true){
                    dbOut("PASSED", true, "#tttOutput");
                }
                else{
                    dbOut("FAILED", true, "#tttOutput");
                }
            }
        }
        function t3(){
            let failed = false;
            dbOut("Test 3: ", false,"#tttOutput");
            game.board = [['O','O','X'],
            ['.','O','.'],
            ['O','X','X']];
            for(let i=0; i<3; i++){
                for(let j=0; j<3; j++){
                    game.row = i;
                    game.col = j;
                    game.next = game.board[i][j];
                    if(checkWin() === true){
                        failed = true;
                    }
                }
            }
            if(failed == false){
                dbOut("PASSED", true, "#tttOutput");
            }
            else{
                dbOut("FAILED", true, "#tttOutput");
            }
        }
        dbOut("Torus Tic Tac Toe Tests: ", true, "#tttOutput");
        t1();
        t2();
        t3();

        
    }
}
