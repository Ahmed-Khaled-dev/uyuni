<%@ taglib uri="http://struts.apache.org/tags-html" prefix="html" %>
<%@ taglib uri="http://struts.apache.org/tags-bean" prefix="bean" %>
<%@ taglib uri="http://rhn.redhat.com/rhn" prefix="rhn" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<html>

<body>
<script src="/javascript/channel_tree.js?cb=${rhn:getConfig('web.buildtimestamp')}" type="text/javascript"></script>
<script type="text/javascript">
    var filtered = ${requestScope.isFiltered};
    function showFiltered() {
        if (filtered)
            showAllRows();
    }
</script>
<rhn:toolbar base="h1" icon="header-channel" 
             helpUrl="/docs/${rhn:getDocsLocale(pageContext)}/reference/software/software-channel-list-menu.html"
             creationUrl="/rhn/channels/manage/Edit.do"
             creationType="channel"
             creationAcl="authorized_for(software.manage.details)">
    <bean:message key="channel.nav.popular"/>
</rhn:toolbar>

<%@ include file="/WEB-INF/pages/common/fragments/channel/channel_tabs.jspf" %>

<p>
    <bean:message key="channels.popular.jsp.header1"/>
</p>

<form method="post" name="rhn_list" action="/rhn/software/channels/Popular.do">
    <rhn:csrf/>
    <rhn:submitted/>
    <table class="table">
        <tr>
            <td>
                <p class="form-input-inline">
                    <bean:message key="channels.popular.jsp.label1"/>
                </p>
                <select name="server_count" class="form-control form-input-inline">
                    <c:forEach var="parameter" items="${counts}">
                        <option value="<c:out value='${parameter.count}' />"
                                <c:if test="${parameter.selected}">
                                    selected
                                </c:if>
                        >
                            <c:out value='${parameter.count}'/>
                        </option>
                    </c:forEach>
                </select>
                <p class="form-input-inline">
                    <bean:message key="channels.popular.jsp.label2"/>
                </p></td>
        </tr>
        <tr>
            <td>
                <INPUT type="submit" class="btn btn-primary form-input-inline"
                       value="<bean:message key='channels.popular.jsp.button'/>">
            </td>
        </tr>
    </table>
    <br/>
    <%@ include file="/WEB-INF/pages/common/fragments/channel/channel_tree_multiorg.jspf" %>
</form>

<script>
    onLoadStuff(3);
    showFiltered();
</script>

</body>
</html>
