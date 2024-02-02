import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Sketch from "react-p5";

class MyLine{
  constructor(p5) {
    this.px = p5.pmouseX
    this.py = p5.pmouseY
    this.x = p5.mouseX
    this.y = p5.mouseY
  }
  
  update(p5){
    p5.stroke(0)
    p5.strokeWeight(2)
    p5.line(this.px, this.py, this.x, this.y)
  }
}

const DrawBox = (props) => {

  var lines = []
  const preload = (p5) => {

  }

  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(props.editorWidth, props.editorHeight).parent(canvasParentRef);
    var toolbar = p5.createDiv()
    var toolbarTitles = p5.createDiv().parent(toolbar)
    var toolbarValues = p5.createDiv().parent(toolbar)
    

  };

  const draw = (p5) => {
    p5.background(245);
    if (p5.mouseIsPressed){
      var line = new MyLine(p5)
      lines.push(line)
    }

    for(var line of lines){
      line.update(p5)
    }
  };

  return (
    <Sketch setup={setup} draw={draw} preload={preload} />
  )
};

export default DrawBox;