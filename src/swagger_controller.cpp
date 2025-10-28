#include "swagger_controller.hpp"
#include <fstream>
#include <sstream>
#include <string>

void registerSwaggerRoutes(httplib::Server &svr)
{
    svr.Get("/swagger.yaml", [](const httplib::Request &, httplib::Response &res)
            {
        std::ifstream file("openapi/swagger.yaml");
        if (!file.is_open())
        {
            res.status = 404;
            res.set_content("swagger.yaml saknas", "text/plain");
            return;
        }

        std::stringstream buffer;
        buffer << file.rdbuf();
        res.set_content(buffer.str(), "application/yaml"); });

    svr.Get("/", [](const httplib::Request &, httplib::Response &res)
            {
        std::ifstream file("openapi/index.html");
        if (!file.is_open())
        {
            res.status = 404;
            res.set_content("index.html saknas", "text/plain");
            return;
        }

        std::stringstream buffer;
        buffer << file.rdbuf();
        res.set_content(buffer.str(), "text/html"); });
}
