import React from 'react'
import {useState} from 'react'
import Navbar from '../Navbar/Navbar'
import { useNavigate } from "react-router-dom";
import '../../Styles/TaskForm.css'
import {
  Box,
  TextField,
  Button,
  Typography,
  
} from "@mui/material";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

export type taskDataArgs={
  title:string,
  description:string,
  status:string,
  priority:string
}


// to get the array elements from locastprage
const TaskForm = () => {
const Navigate = useNavigate()

  const [taskData , settaskData] = useState({
    title :"",
    description:"",
    status:"",
    priority:""
  })

 
 const id = React.useId();

  const handleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
      const {name , value} = e.target;
      
      settaskData((prev) => ({
           ...prev,

           [name] : value,
      }))
    

  }

  const handleSubmit = (e:React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     console.log(taskData)

     if(taskData.status ==="" || taskData.priority===""){
      alert("select status and priority before adding a task")
      return
     }
    const tasks: taskDataArgs[] = JSON.parse(localStorage.getItem("tasks") || "[]")
     tasks.push(taskData);
     
     localStorage.setItem("tasks", JSON.stringify(tasks));
     Navigate("/")
  }
 
  return (
   <>
   <Navbar />
   
    <Box  className="box_styling"
    component="form"
    onSubmit={handleSubmit}
    >
    
    <Box className="taskform_style">

      <Typography variant="h3">ADD NEW TASK</Typography>

     <TextField className="form_name"
     label = "Title"
     type="text"
     name = "title"
     value={taskData.title}
     onChange={handleChange}
     required
     />

     <TextField  className="form_description"
     label = "Description"
     type="text"
     name = "description"
     value={taskData.description}
      onChange={handleChange}
      required
     />

     <FormControl required>
      <FormLabel id={`${id}-label`}>Status</FormLabel>
      <RadioGroup
        aria-labelledby={`${id}-label`}
        defaultValue="pending"
        name="status"
        value={taskData.status}
         onChange={handleChange}

      >
        <FormControlLabel value="pending" control={<Radio />} label="pending" />
        <FormControlLabel value="completed" control={<Radio />} label="completed" />
        
      </RadioGroup>
    </FormControl>

     <FormControl required>
      <FormLabel id={`${id}-label`}>Priority</FormLabel>
      <RadioGroup
        aria-labelledby={`${id}-label`}
        defaultValue="low"
        name="priority"
        value={taskData.priority}
         onChange={handleChange}
      >
        <FormControlLabel value="high" control={<Radio />} label="high" />
        <FormControlLabel value="medium" control={<Radio />} label="medium" />
         <FormControlLabel value="low" control={<Radio />} label="low" />
        
      </RadioGroup>
    </FormControl>
 
 <Box className="form_button">
    <Button 
    type="submit"
    >Add Task</Button>

    <Button onClick={()=>{
      Navigate("/")
    }}>Cancel</Button>
</Box>

    </Box>

</Box>
    
    </>
  )
}

export default TaskForm
