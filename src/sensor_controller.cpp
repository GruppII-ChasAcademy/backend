#include "sensor_controller.hpp"
#include "threshold_checker.hpp"
#include "logger.hpp"

void initSensorRoutes(crow::SimpleApp &app)
{
    CROW_ROUTE(app, "/sensor").methods("POST"_method)([](const crow::request &req)
                                                      {
        auto body = crow::json::load(req.body);
        crow::json::wvalue response;

        for (const auto& item : body) {
            std::string name = item.key();
            double value = item.value().d();
            response[name] = checkThreshold(name, value);
            if (response[name]["status"].s() == "VARNING") {
                logWarning(name, value);
            }
        }

        return crow::response{response}; });
}
