%define _prefix  /opt/cmsoms
%define _hconf   /etc/httpd/conf
%define _hconfd  /etc/httpd/conf.d
%define _homedir %{_prefix}/html
%define debug_package %{nil}

Name: oms-portal-gui
Version: %{_version}
Release: %{_release}
Summary: CMS OMS Portal GUI
Group: CMS/DAQ
License: GPL
Vendor: CMS/DAQ
Packager: %{_packager}
Source: %{name}.tar
ExclusiveOs: linux
Provides: oms-portal-gui
Requires: httpd, mod_ssl
Prefix: %{_prefix}

%description
CMS OMS Portal GUI application.

%files 
%defattr(-,root,root,-)
%attr(-, cmsoms, root) %{_homedir}/*

%prep
%setup -c 

%build

%install
[ $RPM_BUILD_ROOT != / ] && rm -rf $RPM_BUILD_ROOT
mkdir -p $RPM_BUILD_ROOT%{_prefix}
pwd
tar cf - . | (cd  $RPM_BUILD_ROOT%{_prefix}; tar xfp - )
mkdir -p $RPM_BUILD_ROOT%{_hconfd}

%check

%clean
[ $RPM_BUILD_ROOT != / ] && rm -rf $RPM_BUILD_ROOT ||:

%pre

%post

# Fixing owners
chown cmsoms:root %{_prefix}
chown -R cmsoms:root %{_homedir}

# During first install only!
if [ $1 -eq 1 ] ; then

  # Checking if ssl.conf was patched? and patching if required
  if [ "`grep DocumentRoot %{_hconfd}/ssl.conf | grep "%{_homedir}" | wc -l`" -eq 0 ]; then
    DROOT=`grep DocumentRoot %{_hconfd}/ssl.conf | grep -v " *#" | sed "s/^.*[ \t]\+\(.*\)$/\1/g" | sed 's/"//g'`
    if [ ! -z "$DROOT" ]; then
      echo "Patching %{_hconfd}/ssl.conf"
      mv %{_hconfd}/ssl.conf %{_hconfd}/ssl.conf.cmsoms
      sed "s@${DROOT}@%{_homedir}@g" %{_hconfd}/ssl.conf.cmsoms >%{_hconfd}/ssl.conf
    fi
  fi

  # Checking if httpd.conf was patched? and patching if required
  if [ "`grep DocumentRoot %{_hconf}/httpd.conf | grep "%{_homedir}" | wc -l`" -eq 0 ]; then
    DROOT=`grep DocumentRoot %{_hconf}/httpd.conf | grep -v " *#" | sed "s/^.*[ \t]\+\(.*\)$/\1/g" | sed 's/"//g'`
    if [ ! -z "$DROOT" ]; then
      echo "Patching %{_hconf}/httpd.conf"
      mv %{_hconf}/httpd.conf %{_hconf}/httpd.conf.cmsoms
      sed "s@${DROOT}@"%{_homedir}"@g" %{_hconf}/httpd.conf.cmsoms >%{_hconf}/httpd.conf
    fi
  fi

  # Restaring
  systemctl restart httpd

fi

%preun

%postun

# Only for uninstall!
if [ $1 -eq 0 ] ; then

  # Removing folder
  rm -fR %{_homedir}
  rmdir --ignore-fail-on-non-empty %{_prefix}

  # Restoring files
  if [ -f "%{_hconfd}/ssl.conf.cmsoms" ]; then
    mv %{_hconfd}/ssl.conf %{_hconfd}/ssl.conf.cmsoms.rm
    mv %{_hconfd}/ssl.conf.cmsoms %{_hconfd}/ssl.conf
  fi

  # Restoring files
  if [ -f "%{_hconf}/httpd.conf.cmsoms" ]; then
    mv %{_hconf}/httpd.conf %{_hconf}/httpd.conf.cmsoms.rm
    mv %{_hconf}/httpd.conf.cmsoms %{_hconf}/httpd.conf
  fi

  # Restaring
  systemctl restart httpd

fi
