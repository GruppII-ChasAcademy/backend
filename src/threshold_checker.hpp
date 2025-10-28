#pragma once
#include <string>

struct ThresholdResult
{
    std::string status;
    std::string reason;
    double value;
};

ThresholdResult checkThreshold(const std::string &sensorName, double value);
