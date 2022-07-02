
class LineSegment {
    constructor(angle, length, x, y) {
        this.angle = angle;
        this.length = length;
        this.x = x;
        this.y = y;
    }
}

const TRACE_TYPES = {
    NONE: 0,
    POINT: 1,
    LINE: 2
}
class Logic {
    constructor(canvas) {
        this.canvas = canvas;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx = canvas.getContext('2d');
        this.distance = 0;
        this.distanceChange = 0;
        this.stepSize = 1;
        this.trace = TRACE_TYPES.NONE
        this.pastLineSegments = [];
        this.pastPoints = [];
        this.points = [
            // Create a point near the bottom left corner labeled A
            { x: this.canvas.width / 4, y: this.canvas.height - this.canvas.height / 4, label: 'A' },
            // Create a point near the top left corner labeled B
            { x: this.canvas.width / 4, y: this.canvas.height / 4, label: 'B' },
            // Create a point near the top right corner labeled C
            { x: this.canvas.width - this.canvas.width / 4, y: this.canvas.height / 4, label: 'C' },
        ]
        this.ab = this.createLineSegmentsFromPoints('A', 'B');
        this.bc = this.createLineSegmentsFromPoints('B', 'C');
        // Bind the keydown event to the keyDown method
        window.addEventListener('keydown', this.keyDown.bind(this));
        // Bind the keyup event to the keyUp method
        window.addEventListener('keyup', this.keyUp.bind(this));
        // Call the logicLoop method every 10ms
        setInterval(this.logicLoop.bind(this), 10);
        // Call the draw method every 10ms
        setInterval(this.draw.bind(this), 10);
        this.spline = this.calculateSpline(this.ab, this.bc, this.distance);
    }

    logicLoop() {
        // Change the distance by the distanceChange variable and clamp it between 0 and 100
        this.distance += this.distanceChange;
        this.distance = Math.max(0, Math.min(this.distance, 100));

        // If there was a change in the distance
        if (this.distanceChange != 0) {
            // Add the current spline to the pastLineSegments array, if tracing applies
            // Add calculatePointOnLineSegment using the spline to the pastPoints array, if tracing applies
            if (this.trace == TRACE_TYPES.LINE) {
                this.pastLineSegments.push(this.spline);
            } else if (this.trace == TRACE_TYPES.POINT) {
                this.pastPoints.push(this.calculatePointOnLineSegment(this.spline, this.distance));
            }
            // calculate the new spline
            this.spline = this.calculateSpline(this.ab, this.bc, this.distance);
        }
            
        // Reset the distanceChange variable
        this.distanceChange = 0;
        
    }

    keyUp(e) {
        // On left and right arrows set distanceChange to 0 and prevent default
        if (e.keyCode == 37 || e.keyCode == 39) {
            this.distanceChange = 0;
            e.preventDefault();
        }
    }

    keyDown(e) {
        // Use left and right arrows to change the distance to positive stepsize and negative stepsize
        // Use up and down arrows to change the stepsize by 1 and stay between 1 and 100
        // Use the spacebar to switch between tracing modes and clear the pastLineSegments and pastPoints arrays when tracing is set to true
        // Also prevent default if the key was handled
        if (e.keyCode == 37) {
            this.distanceChange = -this.stepSize;
            e.preventDefault();
        }
        if (e.keyCode == 39) {
            this.distanceChange = this.stepSize;
            e.preventDefault();
        }
        if (e.keyCode == 38) {
            this.stepSize = Math.max(1, Math.min(this.stepSize + 1, 100));
            e.preventDefault();
        }
        if (e.keyCode == 40) {
            this.stepSize = Math.max(1, Math.min(this.stepSize - 1, 100));
            e.preventDefault();
        }
        if (e.keyCode == 32) {
            if (this.trace === TRACE_TYPES.NONE) {
                this.trace = TRACE_TYPES.POINT;
            } else if (this.trace === TRACE_TYPES.POINT) {
                this.trace = TRACE_TYPES.LINE;
            } else if (this.trace === TRACE_TYPES.LINE) {
                this.trace = TRACE_TYPES.NONE;
            }
            this.pastLineSegments = [];
            this.pastPoints = [];
            e.preventDefault();
        }
        
    }

    createLineSegmentsFromPoints(label1, label2) {
        var point1 = this.points.find(p => p.label === label1);
        var point2 = this.points.find(p => p.label === label2);
        // Calculate the angle between the two points in radians
        var angle = Math.atan2(point2.y - point1.y, point2.x - point1.x) * 180 / Math.PI;
        // Calculate the length of the line segment
        var length = Math.sqrt(Math.pow(point2.y - point1.y, 2) + Math.pow(point2.x - point1.x, 2));
        return new LineSegment(angle, length, point1.x, point1.y);
    }

    calculatePointOnLineSegment(line, distance) {
        // The distance is the distance from the start of the line segment to the point should be calculated as a percentage of the line segment's length
        // Account for the angle of the line segment
        var length = line.length * distance / 100;
        var x = line.x + length * Math.cos(line.angle * Math.PI / 180);
        var y = line.y + length * Math.sin(line.angle * Math.PI / 180);
        return { x: x, y: y };
    }

    calculateSpline(line1, line2, distance) {
        // Calculate the point on line1 at the given distance
        var point1 = this.calculatePointOnLineSegment(line1, distance);
        // Calculate the point on line2 at the given distance
        var point2 = this.calculatePointOnLineSegment(line2, distance);
        // Calculate the angle between the two points in radians
        var angle = Math.atan2(point2.y - point1.y, point2.x - point1.x) * 180 / Math.PI;
        // Calculate the length of the line segment
        var length = Math.sqrt(Math.pow(point2.y - point1.y, 2) + Math.pow(point2.x - point1.x, 2));
        return new LineSegment(angle, length, point1.x, point1.y);

    }

    drawSpline() {
        // Draw the spline in orange accounting for the angle
        this.ctx.strokeStyle = 'orange';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.spline.x, this.spline.y);
        this.ctx.lineTo(this.spline.x + this.spline.length * Math.cos(this.spline.angle * Math.PI / 180), this.spline.y + this.spline.length * Math.sin(this.spline.angle * Math.PI / 180));
        this.ctx.stroke();
        
        // Draw the endpoints of the spline as circles in blue
        this.ctx.fillStyle = 'blue';
        this.ctx.beginPath();
        this.ctx.arc(this.spline.x, this.spline.y, 5, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(this.spline.x + this.spline.length * Math.cos(this.spline.angle * Math.PI / 180), this.spline.y + this.spline.length * Math.sin(this.spline.angle * Math.PI / 180), 5, 0, 2 * Math.PI);
        this.ctx.fill();

        // Put a white label of S and E near the endpoints of the spline
        // Use 20 point font
        // The label should never overlap the endpoints of the spline
        // Account for the size of the font and the size of the blue circles
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = 'white';
        // Calulate the size of the label and the size of the blue circles
        var labelWidth = this.ctx.measureText('S').width;
        var circleSize = 10;
        // Calculate the x and y coordinates of the endpoints of the lineSegment
        var x1 = this.spline.x;
        var y1 = this.spline.y;
        var x2 = this.spline.x + this.spline.length * Math.cos(this.spline.angle * Math.PI / 180);
        var y2 = this.spline.y + this.spline.length * Math.sin(this.spline.angle * Math.PI / 180);

        // Draw both endpoints of the spline as circles in blue
        this.ctx.fillStyle = 'blue';
        this.ctx.beginPath();
        this.ctx.arc(x1, y1, circleSize, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(x2, y2, circleSize, 0, 2 * Math.PI);
        this.ctx.fill();
        // Calculate the x and y coordinates of both labels make sure they don't overlap with the blue circles and account for the size of the label
        this.ctx.fillStyle = 'white';
        var x1Label = x1 - labelWidth / 2 - circleSize;
        var y1Label = y1 - circleSize;
        var x2Label = x2 - labelWidth / 2 - circleSize;
        var y2Label = y2 - circleSize;
        // Draw the labels
        this.ctx.fillText('S', x1Label, y1Label);
        this.ctx.fillText('E', x2Label, y2Label);

        // Calculate and draw the point on the spline at the given distance
        // Use a pink circle
        const point = this.calculatePointOnLineSegment(this.spline, this.distance);
        this.ctx.fillStyle = 'pink';
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        this.ctx.fill();
        // Label the point 
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('P', point.x - 10, point.y - 10);
    }

    // Draw line segments ab and bc
    // Draw a spline between the two lines that is a distance from the intersection of the lines in the positive direction
    // Draw a circle at the end of the spline
    // Draw a circle at the beginning of the spline
    // Draw a circle at the middle of the spline
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw the stepSize text in the top right corner account for the size of the font and include a buffer
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('Step Size: ' + this.stepSize, this.canvas.width - this.ctx.measureText('Step Size: ' + this.stepSize).width - 20, 30);
        // Calculate the text of the trace by finding what index the trace is in Object.entries of TRACE_TYPES        
        var traceText = Object.entries(TRACE_TYPES).find(entry => entry[1] === this.trace)[0];
        // Draw the trace text below the stepSize text with Trace: at the beginning
        this.ctx.fillText('Trace: ' + traceText, this.canvas.width - this.ctx.measureText('Trace: ' + traceText).width - 20, 60);

        // Draw each point on the canvas as a 10px circle in red and label it with the point's label
        this.points.forEach(p => {
            this.ctx.fillStyle = 'red';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 10, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(p.label, p.x - 10, p.y - 10);
        })

        // Draw line segments ab and bc in white accounting for the angle and length of the line segment
        this.ctx.strokeStyle = 'white';
        this.ctx.beginPath();
        this.ctx.moveTo(this.ab.x, this.ab.y);
        this.ctx.lineTo(this.ab.x + this.ab.length * Math.cos(this.ab.angle * Math.PI / 180), this.ab.y + this.ab.length * Math.sin(this.ab.angle * Math.PI / 180));
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(this.bc.x, this.bc.y);
        this.ctx.lineTo(this.bc.x + this.bc.length * Math.cos(this.bc.angle * Math.PI / 180), this.bc.y + this.bc.length * Math.sin(this.bc.angle * Math.PI / 180));
        this.ctx.stroke();

        // Draw the pastLineSegments accounting for the angle and length of the line segment
        this.ctx.strokeStyle = 'white';
        this.pastLineSegments.forEach(ls => {
            this.ctx.beginPath();
            this.ctx.moveTo(ls.x, ls.y);
            this.ctx.lineTo(ls.x + ls.length * Math.cos(ls.angle * Math.PI / 180), ls.y + ls.length * Math.sin(ls.angle * Math.PI / 180));
            this.ctx.stroke();
        })

        // Draw pastPoints as 1px dots in white
        this.pastPoints.forEach(p => {
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 1, 0, 2 * Math.PI);
            this.ctx.fill();
        })

        // Draw the spline
        this.drawSpline(this.ab, this.bc, this.distance, 10);
    }
}

function startGame() {
    const canvas = document.getElementById('game');

    const logic = new Logic(canvas);
    logic.draw();
}
