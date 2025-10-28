#include "httplib.h"
#include "sensor_controller.hpp"
#include "threshold_checker.hpp"
#include <string>

void registerSensorRoutes(httplib::Server &svr)
{
    svr.Get("/sensors", [](const httplib::Request &, httplib::Response &res)
            {
        std::string response = R"([{"name":"Temperatur"},{"name":"Luftfuktighet"},{"name":"CO2"}])";
        res.set_content(response, "application/json"); });

    svr.Get(R"(/sensors/(\w+)/(\d+(\.\d+)?))", [](const httplib::Request &req, httplib::Response &res)
            {
        std::string name = req.matches[1];
        double value = std::stod(req.matches[2]);
        ThresholdResult result = checkThreshold(name, value);

        std::string json = "{"
                           "\"sensor\":\"" + name + "\","
                           "\"value\":" + std::to_string(result.value) + ","
                           "\"status\":\"" + result.status + "\","
                           "\"reason\":\"" + result.reason + "\"}";
        res.set_content(json, "application/json"); });
}
