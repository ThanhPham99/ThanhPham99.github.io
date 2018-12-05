import React, { Component } from 'react';
// import { Redirect } from "react-router-dom";
// import MainContainer from '../MainContainer/MainContainer';
class Form extends Component {
    constructor(props){
        super(props);
        this.state={
            redirected: false
        }
    }
    getValue = ()=>{
        var ReceivedValue="";
        ReceivedValue += ' '+this.state.Name;
        ReceivedValue += ' '+this.state.Email;
        ReceivedValue += ' '+this.state.Messenges;
        return ReceivedValue;
    }
    isChange = (event)=>{
        const ten = event.target.name;
        const giatri = event.target.value;
        this.setState({
            [ten]: giatri
        });
    }
    submitForm= (event)=>{
     event.preventDefault();
     this.setState({
         redirected: true
     });
//    if (this.state.redirected===true)
//    return <Redirect to={MainContainer} />;
   }
    render() {
        return (
            <div className="ContactForm">
            <p style={{fontSize: '1.5rem', textAlign:'center', color:'blue'}}>Contact Us</p>
            <form name="sentMessage">
                    <p>Name:</p>
                    <input type="text" name="Name" onChange={(event)=>{this.isChange(event)}}/>
                    <br /><p>Email:</p>
                    <input type="text" name="Email" onChange={(event)=>{this.isChange(event)}}/>
                    <br /><p>Messenges:</p>
                    <textarea name="Messenges" rows={4} onChange={(event)=>{this.isChange(event)}}/>
                    <button type="submit" onClick={(event)=>{this.submitForm(event)}}>Submit</button>
            </form>
            <video src="meo.mp4" width="480" height="360" autoPlay controls ></video>
            </div>
        );
    }
}

export default Form;