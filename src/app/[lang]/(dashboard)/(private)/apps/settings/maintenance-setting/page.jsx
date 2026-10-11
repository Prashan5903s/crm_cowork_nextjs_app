"use client";

import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

import {
  Card,
  CardContent,
  Typography,
  RadioGroup,
  Skeleton,
  FormControlLabel,
  Radio,
  TextField,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from "@mui/material";

import Grid from "@mui/material/Grid2"; // For Grid2

import { toast } from "react-toastify";

const MaintenanceSetting = () => {
  const { data: session } = useSession();
  const token = session?.user?.token;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [costType, setCostType] = useState();
  const [data, setData] = useState(null);
  const [values, setValues] = useState({});
  const [createData, setCreateData] = useState(null);
  const [errors, setErrors] = useState({});

  const [unitData, setUnitData] = useState({
    unit_name: "",
    unit_value: "",
  });

  const handleValueChange = (id, val) => {
    setValues((prev) => ({
      ...prev,
      [id]: val,
    }));

    // जैसे ही user कुछ लिखे error हट जाए
    setErrors((prev) => {
      const newErrors = { ...prev };

      delete newErrors[id];

      return newErrors;
    });
  };

  const reset = () => {
    setData(null);
    fetchMaintenance();
    setErrors({});
  };

  const fetchMaintenance = async () => {
    try {
      const response = await fetch(
        `${API_URL}/company/maintenance-setting`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        const value = result?.data;

        const activeItems = value.filter(item => {
          if (costType) {
            return item.cost_type === costType;
          } else {
            return item.status === true;
          }
        });

        const costTypes = activeItems?.[0]?.cost_type;
        const unitType = activeItems?.[0]?.unit_type;
        const fixed_data = activeItems?.[0]?.fixed_data;

        setCostType(costTypes)

        const formattedData = fixed_data?.reduce((acc, item) => {
          acc[item.apartment_type] = item.unit_value;

          return acc;
        }, {});

        setValues(formattedData || {});
        setUnitData(unitType || { unit_name: "", unit_value: "" });
        setData(activeItems?.[0]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCreateData = async () => {
    try {
      const response = await fetch(
        `${API_URL}/company/maintenance-setting/data/create`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setCreateData(result?.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (API_URL && token) {
      setData(null);
      fetchCreateData();
      fetchMaintenance();
    }
  }, [API_URL, token, costType]);

  const handleSubmit = async () => {
    try {
      let newErrors = {};

      if (costType === "1") {
        createData.forEach((apt) => {
          if (!values?.[apt._id]) {
            newErrors[apt._id] = "This field cannot be empty";
          }
        });
      } else {
        if (!unitData.unit_name) {
          newErrors.unit_name = "Unit Name cannot be empty";
        }

        if (!unitData.unit_value) {
          newErrors.unit_value = "Unit Value cannot be empty";
        }
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        toast.error("Any field cannot be left empty", {
          autoClose: 1000,
        });

        return;
      }

      const payload = {
        unit_data: costType === "1" ? values : unitData,
        cost_type: costType,
      };

      const response = await fetch(
        `${API_URL}/company/maintenance-setting/${costType}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (response.ok) {
        fetchMaintenance();
        toast.success("Maintenance setting updated successfully", {
          autoClose: 1000,
        });
      } else {
        toast.error(result.message || "Failed to update maintenance setting");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  if (!data || !createData) {
    return (
      <Card sx={{ p: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Skeleton width="60%" />
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            <Skeleton width="40%" />
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 6 }}>
              <Skeleton variant="rectangular" height={60} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Skeleton variant="rectangular" height={60} />
            </Grid>
          </Grid>

          {costType === "1" && (
            <Paper sx={{ mt: 4 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f6f8" }}>
                    <TableCell>
                      <Skeleton width="80%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton width="50%" />
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[1, 2, 3, 4].map((row) => (
                    <TableRow key={row}>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          {costType === "2" && (
            <Grid container spacing={2} sx={{ mt: 4 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Skeleton height={40} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Skeleton height={40} />
              </Grid>
            </Grid>
          )}

          <Grid container justifyContent="flex-start" sx={{ mt: 3 }}>
            <Skeleton variant="rectangular" width={120} height={40} />
          </Grid>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ p: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: "2px" }} gutterBottom>
          Maintenance Settings <span>*</span>
        </Typography>

        <RadioGroup
          row
          value={costType}
          onChange={(e) => setCostType(e.target.value)}
          sx={{ gap: 2, mb: 2, mt: 4 }}
        >
          <Card
            variant="outlined"
            sx={{
              p: 2,
              flex: 1,
              cursor: "pointer",
              borderColor: costType === "1" ? "primary.main" : "grey.300",
            }}
          >
            <FormControlLabel
              value="1"
              control={<Radio />}
              label={
                <div>
                  <Typography variant="body1">Fixed Value</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Maintenance cost will be fixed value for all apartments.
                  </Typography>
                </div>
              }
              sx={{ alignItems: "flex-start" }}
            />
          </Card>

          <Card
            variant="outlined"
            sx={{
              p: 2,
              flex: 1,
              cursor: "pointer",
              borderColor: costType === "2" ? "primary.main" : "grey.300",
            }}
          >
            <FormControlLabel
              value="2"
              control={<Radio />}
              label={
                <div>
                  <Typography variant="body1">Unit Type</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Maintenance cost will be calculated based on the unit type.
                  </Typography>
                </div>
              }
              sx={{ alignItems: "flex-start" }}
            />
          </Card>
        </RadioGroup>

        {costType === "1" && (
          <Paper sx={{ mt: 6 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f6f8" }}>
                  <TableCell>
                    <b>Apartment Type</b>
                  </TableCell>
                  <TableCell>
                    <b>Unit Value ($)</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {createData.map((apt) => (
                  <TableRow key={apt?._id}>
                    <TableCell>{apt?.name}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={values?.[apt._id] || ""}
                        onChange={(e) =>
                          handleValueChange(apt._id, e.target.value)
                        }
                        error={!!errors?.[apt._id]}
                        helperText={errors?.[apt._id] || ""}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {costType === "2" && (
          <Grid container spacing={2} sx={{ mt: 6 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Unit Name"
                value={unitData?.unit_name || ""}
                onChange={(e) =>
                  setUnitData((prev) => ({
                    ...prev,
                    unit_name: e.target.value,
                  }))
                }
                error={!!errors?.unit_name}
                helperText={errors?.unit_name || ""}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Unit Value ($)"
                value={unitData?.unit_value || ""}
                onChange={(e) =>
                  setUnitData((prev) => ({
                    ...prev,
                    unit_value: e.target.value,
                  }))
                }
                error={!!errors?.unit_value}
                helperText={errors?.unit_value || ""}
                required
              />
            </Grid>
          </Grid>
        )}

        <Grid container gap={2} justifyContent="flex-start" sx={{ mt: 3 }}>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Save
          </Button>
          <Button variant="outlined" color="secondary" onClick={reset}>
            Reset
          </Button>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default MaintenanceSetting;
