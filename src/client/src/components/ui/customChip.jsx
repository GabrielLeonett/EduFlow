
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

export default function DeletableChips({ values = [], onChange }) {
  const handleDelete = (label) => {
    onChange(values.filter((v) => v !== label));
  };

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
      {values.map((label) => (
        <Chip
          key={label}
          label={label}
          onDelete={() => handleDelete(label)}
          variant="outlined"
        />
      ))}
    </Stack>
  );
}
