#include "threshold_checker.hpp"
crow::json::wvalue checkThreshold(const std::string &sensorName, double value)
{
    double min = 0.0, max = 0.0;
    if (sensorName == "Temperatur")
    {
        min = 0.0;
        max = 30.0;
    }
    else if (sensorName == "Luftfuktighet")
    {
        min = 20.0;
        max = 70.0;
    }
    else if (sensorName == "CO2")
    {
        min = 0.0;
        max = 1000.0;
    }

    crow::json::wvalue result;
    result["value"] = value;
    if (value < min || value > max)
    {
        result["status"] = "VARNING";
        result["reason"] = "Avvikelse i " + sensorName;
    }
    else
    {
        result["status"] = "OK";
    }
    return result;
}
