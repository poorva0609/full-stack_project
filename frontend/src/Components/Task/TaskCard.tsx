import {
  Box,
  Typography,
  Button
} from "@mui/material";
import '../../Styles/TaskCard.css'

interface propData{
  task:{
    title:string , 
    description:string ,
    status:string  ,
    priority:string
  },
  onComplete:(title:string) => void,
  onDelete:(title:string) => void
}

const TaskCard = ({task , onComplete , onDelete} : propData) => {

  const {title , description , status  , priority} = task;
  
  return (
  <Box className="parent_card">

    <Box className="child_card1">

      <Box className="metadata-box">
        <Box className="title_style">
          <Typography variant="h5" className="task_title">
            {title}
          </Typography>
        </Box>

        <Box className="description_style">
          <Typography className="task_description">
            {description}
          </Typography>
        </Box>
      </Box>

      <Box className="statusbox">

        <Box className="status_style">
          <Typography className="label">
            Status
          </Typography>

          <Typography className={`value status-${status?.toLowerCase()}`}>
            {status}
          </Typography>
        </Box>

        <Box className="priority_style">
          <Typography className="label">
            Priority
          </Typography>

          <Typography className="value priority-value">
            {priority}
          </Typography>
        </Box>

      </Box>

    </Box>

    <Box className="child_card2">
      <Button
        className="complete_button"
        variant="contained"
        onClick={() => onComplete(title)}
      >
        COMPLETED
      </Button>

      <Button
        className="complete_button"
        variant="contained"
        onClick={() => onDelete(title)}
      >
        DELETE
      </Button>
    </Box>

  </Box>
)
}

export default TaskCard
