import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneForwardedIcon from '@mui/icons-material/PhoneForwarded';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { Agent } from '../agents.types';

interface AgentCardProps {
  agent: Agent;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AgentCard = ({ agent, onSelect, onEdit, onDelete }: AgentCardProps) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '3px solid',
        borderLeftColor: 'primary.main',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderLeftColor: 'primary.light',
          boxShadow: (t) => `0 0 20px ${alpha(t.palette.primary.main, 0.1)}`,
        },
      }}
    >
      <CardContent sx={{ flex: 1, p: 2.5 }}>
        {/* Agent identity */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar
            src={agent.image || undefined}
            sx={{
              width: 42,
              height: 42,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
              color: 'primary.main',
              border: '1px solid',
              borderColor: (t) => alpha(t.palette.primary.main, 0.2),
            }}
          >
            {!agent.image && <SmartToyIcon sx={{ fontSize: 22 }} />}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {agent.name}
            </Typography>
            <Chip
              label={agent.voice.replace('Polly.', '').replace('-Neural', '')}
              size="small"
              variant="outlined"
              sx={{
                height: 20,
                fontSize: '0.62rem',
                fontWeight: 600,
                mt: 0.5,
                letterSpacing: '0.04em',
              }}
            />
          </Box>
        </Box>

        {/* System prompt preview */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '0.8rem',
            lineHeight: 1.5,
            mb: 1.5,
          }}
        >
          {agent.systemPrompt}
        </Typography>

        {/* Meta */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.65rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Created {new Date(agent.createdAt).toLocaleDateString()}
          </Typography>
          {agent.schedule?.isActive && (
            <Tooltip title={`Scheduled: ${agent.schedule.cronExpression}`}>
              <Chip
                icon={<ScheduleIcon sx={{ fontSize: 12 }} />}
                label="Scheduled"
                size="small"
                color="success"
                variant="outlined"
                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600 }}
              />
            </Tooltip>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2.5, pb: 2, pt: 0 }}>
        <Button
          size="small"
          variant="contained"
          startIcon={<PhoneForwardedIcon sx={{ fontSize: 16 }} />}
          onClick={onSelect}
          sx={{ fontSize: '0.78rem', px: 2, py: 0.7 }}
        >
          Use Agent
        </Button>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={onEdit}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                width: 30,
                height: 30,
                '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
              }}
            >
              <EditIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={onDelete}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                width: 30,
                height: 30,
                '&:hover': { borderColor: 'error.main', color: 'error.main' },
              }}
            >
              <DeleteIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

export default AgentCard;
