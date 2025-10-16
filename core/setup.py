import os
from setuptools import setup, find_packages

lib_name = "orbslam3.cpython-310-x86_64-linux-gnu.so"
lib_path = os.path.join("build", lib_name)

package_dir = "orbslam3"
os.makedirs(package_dir, exist_ok=True)

import shutil
shutil.copy2(lib_path, os.path.join(package_dir, lib_name))

setup(
    name="orbslam3",
    version="0.0.0",
    packages=find_packages(),
    package_data={"orbslam3": [lib_name]},
    install_requires=["numpy"],
    zip_safe=False,
)
